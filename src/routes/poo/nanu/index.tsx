import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/poo/nanu/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/poo/nanu/"!</div>
}
