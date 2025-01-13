import Heading from "@theme/Heading"
import clsx from "clsx"
import styles from "./styles.module.css"

export default function Advantages() {
  const list = [
    {
      caption: "RxJS",
      description: "Reactivity with RxJS",
      image: "img/rxjs.svg",
    },

    {
      caption: "Immutable",
      description: "Efficient data management with Immutable",
      image: "img/immutable.svg",
    },

    {
      caption: "Inversify",
      description: "Inversion of Control with Inversify",
      image: "img/inversify.svg",
    },

    {
      caption: "Ramda",
      description: "Functional Programming with Ramda",
      image: "img/ramda.png",
    },

    {
      caption: "Mustache",
      description: "Template processing with Mustache",
      image: "img/mustache.png",
    },
  ]

  const cards = list.map((c) => {
    return (
      <div key={c.caption} className={clsx("col col--4")}>
        <div className={clsx("text--center margin-bottom--md", styles.card)}>
          <img src={c.image} alt={c.caption} className={styles.logo} />
        </div>
        <div className="text--center padding-horiz--md">
          <Heading as="h3">{c.caption}</Heading>
          <p>{c.description}</p>
        </div>
      </div>
    )
  })

  return (
    <section className={styles.advantages}>
      <div className="container">
        <div className={clsx("row", styles.container)}>{cards}</div>
      </div>
    </section>
  )
}
