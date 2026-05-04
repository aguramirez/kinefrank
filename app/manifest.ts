import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THUNDER REHABILITACIÓN',
    short_name: 'THUNDER',
    description: 'Gestión de pacientes',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAD700',
    theme_color: '#FAD700',
    icons: [
      {
        src: '/api/icon-square',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
