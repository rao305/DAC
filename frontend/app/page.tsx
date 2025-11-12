import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to conversations page (v0 UI)
  redirect('/conversations')
}
