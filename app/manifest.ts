import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THUNDER REHABILITACIÓN',
    short_name: 'THUNDER',
    description: 'Gestión de pacientes',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#FAD700',
    icons: [
      {
        src: '/api/icon-square',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/icon-square',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }
}
