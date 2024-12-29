#!/usr/bin/env node
import inquirer from "inquirer"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

class Handler {
  #nextHandler
  config

  constructor(config) {
    this.config = config
  }

  setNext(handler) {
    this.#nextHandler = handler
    return this.#nextHandler
  }

  async handle(data) {
    if (this.#nextHandler) {
      return this.#nextHandler.handle(data)
    }

    return null
  }
}

class List extends Handler {
  constructor(config) {
    super(config)
  }

  async handle(prevAnswers) {
    let answers = {}

    if (
      prevAnswers[this.config.deps] === null ||
      prevAnswers[this.config.deps] === undefined ||
      prevAnswers[this.config.deps] === this.config.key
    ) {
      answers = await inquirer.prompt([
        {
          type: "list",
          name: this.config.name,
          message: this.config.message,
          choices: this.config.choices,
        },
      ])
    }

    return super.handle({ ...prevAnswers, ...answers })
  }
}

class Input extends Handler {
  constructor(config) {
    super(config)
  }

  async handle(prevAnswers) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: this.config.name,
        message: this.config.message,
        default: this.config.default,
      },
    ])

    return super.handle({ ...prevAnswers, ...answers })
  }
}

class Setup extends Handler {
  async handle(answersPrev) {
    const { toolsType, projectName } = answersPrev

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    const templateFolder = path.join(__dirname, toolsType)

    if (!fs.existsSync(templateFolder)) {
      console.log(`Something went wrong`)
      return process.exit(1)
    }

    const targetPath = path.resolve(projectName)

    if (fs.existsSync(targetPath)) {
      console.log(`Select name: ${projectName} already exist`)
      return process.exit(1)
    }

    fs.cpSync(templateFolder, projectName, {
      recursive: true,
    })

    const gitIgnoreExample = path.join(projectName, ".gitignore-example")
    const gitIgnore = path.join(projectName, ".gitignore")
    fs.rename(gitIgnoreExample, gitIgnore, (err) => {
      if (err) {
        console.log(`Error rename .gitignore-example`)
        return process.exit(1)
      }
    })

    console.log("Project created")
  }
}

class TemplateCreator {
  config
  #handlerInstances = []

  constructor(config) {
    this.config = config

    this.config.forEach((config) => {
      let instance = new config.handler(config)
      this.#handlerInstances.push(instance)
    })

    this.#handlerInstances.forEach((h, index, arr) => {
      if (arr[index + 1]) {
        h.setNext(arr[index + 1])
      }
    })
  }

  run() {
    this.#handlerInstances.at(0).handle({})
  }
}

const templateCreator = new TemplateCreator([
  {
    type: "list",
    handler: List,
    deps: null,
    key: null,
    name: "toolsType",
    message: "select tools",
    choices: ["base", "playground"],
  },

  {
    type: "input",
    handler: Input,
    deps: null,
    key: null,
    name: "projectName",
    message: "project name",
    default: "brainful-app",
  },

  {
    type: null,
    handler: Setup,
    deps: null,
    key: null,
    name: null,
    message: null,
    default: null,
  },
])

templateCreator.run()
