// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightSidebarTopics from 'starlight-sidebar-topics';

// https://astro.build/config
export default defineConfig({


	integrations: [
		starlight({
			plugins: [
				starlightSidebarTopics([
					{
						label: 'Amethyst Docs',
						link: '/dev/development/',
						icon: 'star',
						items: [
							{ label: 'Development Status', link: '/dev/development/' },
							{ label: 'API Reference', link: '/dev/api-reference/' },
							{ label: 'Code Examples', link: '/dev/examples/' },
							{ label: 'Contributing Guide', link: '/dev/contributing/' },
						],
					},
				]),
			],
			pagefind: true,
			lastUpdated: true,
			editLink: {
				baseUrl: 'https://github.com/Amethyst-Development/docs/edit/main/',
			},
			title: 'Amethyst Docs',
			description: 'Documentation for all projects under the Amethyst Development umbrella.',
			logo: {
				src: './src/assets/amethyst-logo.svg',
				replacesTitle: false,
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/Amethyst-Development' },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.com/invite/5jTmCzjvZQ' }

			],
			customCss: [
				"@fontsource/jetbrains-mono/400.css",
				"@fontsource/jetbrains-mono/600.css",
				"@fontsource/poppins/400.css",
				"./src/styles/theme.css",
			],
			components: {
				Banner: './src/components/overrides/Banner.astro',
				Footer: './src/components/overrides/Footer.astro',
				Head: './src/components/overrides/Head.astro',
				MobileTableOfContents: './src/components/overrides/MobileTableOfContents.astro',
				TableOfContents: './src/components/overrides/TableOfContents.astro',
				PageFrame: './src/components/overrides/PageFrame.astro',
				Sidebar: "@astrojs/starlight/components/Sidebar.astro",
			},
			expressiveCode: {
				themes: ['vitesse-light', 'vitesse-dark'],
			},
		}),
	],
});
