import Link from "@docusaurus/Link"
import { CONTENT } from "@site/src/config/content"
import IconBrainfuljs from "@site/static/img/brainfuljs.svg"
import Heading from "@theme/Heading"
import clsx from "clsx"
import styles from "./styles.module.css"

const config = {
  link: {
    content: "Learn",
    to: "/docs/learn",
  },
}

export function ContainerHeader() {
  return (
    <header className={clsx("hero", styles.hero)}>
      <div className="container">
        <Heading as="h1" className={clsx("hero__title", styles.title)}>
          {CONTENT.title}
        </Heading>
        <IconBrainfuljs width="200" height="200" />
        <p className={clsx("hero__subtitle", styles.tagline)}>
          {CONTENT.tagline}
        </p>
        <p className={clsx("text-marc-marquez", styles.description)}>
          {CONTENT.description}
        </p>
        <div>
          <Link
            className="button button--secondary button--lg"
            to={config.link.to}
          >
            {config.link.content}
          </Link>
        </div>
      </div>
    </header>
  )
}
