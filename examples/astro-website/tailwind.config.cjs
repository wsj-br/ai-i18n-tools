module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				brand: {
					dark: '#0a0a0c',
					surface: '#16161a',
					accent: '#8b5cf6',
					secondary: '#3b82f6',
                    muted: '#94a3b8'
				}
			},
			backgroundImage: {
				'glow-gradient': 'radial-gradient(circle at 50% -20%, rgba(139, 92, 246, 0.15), transparent 80%)',
			}
		},
	},
}