import type * as Preset from "@docusaurus/preset-classic"
import type { Config } from "@docusaurus/types"
import { themes as prismThemes } from "prism-react-renderer"

const config: Config = {
  title: "Brainful",
  tagline: "Library for web user interfaces",
  favicon: "/favicon.ico",

  url: "https://brainfuljs.dev",
  baseUrl: "/",
  trailingSlash: false,

  organizationName: "brainfuljs",
  projectName: "brainfuljs.dev",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    },
    {
      tagName: "meta",
      attributes: {
        name: "apple-mobile-web-app-title",
        content: "Brainful",
      },
    },
    {
      tagName: "link",
      attributes: {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    },
  ],

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/brainfuljs/brainful/edit/main/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          editUrl: "https://github.com/brainfuljs/brainful/edit/main/",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/brainfuljs-social-card.png",
    navbar: {
      title: "Brainful.js",
      logo: {
        alt: "Brainful",
        src: "img/brainfuljs.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "learnSidebar",
          position: "left",
          label: "Learn",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/brainfuljs/brainful",
          position: "right",
          html: `
            <svg width="24" height="24" viewBox="0 0 20 20"  xmlns="http://www.w3.org/2000/svg">
              <path d="M10 0c5.523 0 10 4.59 10 10.253 0 4.529-2.862 8.371-6.833 9.728-.507.101-.687-.219-.687-.492 0-.338.012-1.442.012-2.814 0-.956-.32-1.58-.679-1.898 2.227-.254 4.567-1.121 4.567-5.059 0-1.12-.388-2.034-1.03-2.752.104-.259.447-1.302-.098-2.714 0 0-.838-.275-2.747 1.051A9.396 9.396 0 0 0 10 4.958a9.375 9.375 0 0 0-2.503.345C5.586 3.977 4.746 4.252 4.746 4.252c-.543 1.412-.2 2.455-.097 2.714-.639.718-1.03 1.632-1.03 2.752 0 3.928 2.335 4.808 4.556 5.067-.286.256-.545.708-.635 1.371-.57.262-2.018.715-2.91-.852 0 0-.529-.985-1.533-1.057 0 0-.975-.013-.068.623 0 0 .655.315 1.11 1.5 0 0 .587 1.83 3.369 1.21.005.857.014 1.665.014 1.909 0 .271-.184.588-.683.493C2.865 18.627 0 14.783 0 10.253 0 4.59 4.478 0 10 0" fill-rule="evenodd" fill="currentColor" />
            </svg>
          `,
        },
      ],
    },
    footer: {
      style: "light",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Learn",
              to: "/docs/learn",
            },
            {
              label: "Overview",
              to: "/docs/overview",
            },
            {
              label: "Installation",
              to: "/docs/installation",
            },
            {
              label: "Tutorial",
              to: "/docs/category/tutorial",
            },
            {
              label: "API",
              to: "/docs/category/api",
            },
          ],
        },
        {
          title: "Examples",
          items: [
            {
              label: "MathSprintGame",
              href: "https://github.com/GurovDmitriy/mathsprintgame",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "GitHub",
              href: "https://github.com/brainfuljs/brainful",
            },
            {
              label: "GurovDmitriy",
              href: "https://github.com/GurovDmitriy",
            },
          ],
        },
      ],
      copyright: `
       Released under the MIT License. Built with Docusaurus.</br>
       Copyright © 2024-PRESENT Dmitriy Gurov, and Brainful.js contributors.
       `,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,
}

export default config
