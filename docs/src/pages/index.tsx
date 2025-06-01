import { CONTENT } from "@site/src/config/content"
import Advantages from "@site/src/features/Advantages/Advantages"
import { ContainerHeader } from "@site/src/features/Header"
import Layout from "@theme/Layout"
import clsx from "clsx"
import styles from "./styles.module.css"

export default function Home() {
  return (
    <Layout description={CONTENT.tagline}>
      <ContainerHeader />
      <main>
        <Advantages />

        <div className={clsx("container", styles.section)}>
          <section className={styles.quotes}>
            <div className={styles.box}>
              <a href="https://github.com/benlesh">
                <img
                  className={clsx(
                    "avatar__photo avatar__photo--xl",
                    styles.avatar,
                  )}
                  src="https://avatars.githubusercontent.com/u/1540597?v=4"
                />
              </a>
              <div className={styles.info}>
                <h3 className={styles.author}>Ben Lesh</h3>
                <div className={clsx("text--primary")}>
                  <a className={styles.link} href="https://rxjs.dev/">
                    RxJS
                  </a>{" "}
                  core team lead
                </div>
                <cite className={styles.cite}>
                  I think this is a very interesting take on a frontend
                  framework, and I'm excited to see where it goes.
                </cite>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  )
}
