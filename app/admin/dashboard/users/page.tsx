import prisma from "@/lib/prisma"
import { UsersTable } from "@/components/users-table"

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  const formattedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    joinDate: `${user.createdAt.getDate()} ${user.createdAt.toLocaleString("en-US", { month: "short" })}, ${user.createdAt.getFullYear()}`,
  }))

  return (
    <div className="flex flex-1 flex-col gap-6">
      <UsersTable data={formattedUsers} />
    </div>
  )
}
