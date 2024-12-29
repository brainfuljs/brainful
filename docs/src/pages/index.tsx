import Layout from "@theme/Layout"

import { CONTENT } from "@site/src/config/content"
import Advantages from "@site/src/features/Advantages/Advantages"
import { ContainerHeader } from "@site/src/features/Header"

export default function Home() {
  return (
    <Layout description={CONTENT.tagline}>
      <ContainerHeader />
      <main>
        <Advantages />
      </main>
    </Layout>
  )
}
