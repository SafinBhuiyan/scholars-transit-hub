import * as React from "react"
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconShield,
  IconSearch,
} from "@tabler/icons-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import prisma from "@/lib/prisma"

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "default"
    case "SUPERVISOR":
      return "secondary"
    default:
      return "outline"
  }
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })
  return users
}

function UsersTable({ users }: { users: Awaited<ReturnType<typeof getUsers>> }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead className="text-center">Role</TableHead>
          <TableHead className="text-center">Join Date</TableHead>
          <TableHead className="text-center">Email Verified</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="text-center text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <Switch
                  checked={user.emailVerified}
                  disabled
                />
              </div>
            </TableCell>
            <TableCell className="text-center">
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <IconDots className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <IconEdit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <IconShield className="mr-2 h-4 w-4" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <IconTrash className="mr-2 h-4 w-4" />
                      Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function UsersPage() {
  const users = await getUsers()
  
  const allUsers = users
  const adminUsers = users.filter(u => u.role === "ADMIN")
  const supervisorUsers = users.filter(u => u.role === "SUPERVISOR")
  const regularUsers = users.filter(u => u.role === "USER")

  return (
    <div className="flex flex-1 flex-col gap-6">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">
              All Users
              <Badge variant="secondary" className="ml-2">
                {allUsers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="admin">
              Admins
              <Badge variant="secondary" className="ml-2">
                {adminUsers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="supervisor">
              Supervisors
              <Badge variant="secondary" className="ml-2">
                {supervisorUsers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="user">
              Users
              <Badge variant="secondary" className="ml-2">
                {regularUsers.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-full max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <div className="rounded-xl border bg-card">
            <UsersTable users={allUsers} />
          </div>
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <div className="rounded-xl border bg-card">
            <UsersTable users={adminUsers} />
          </div>
        </TabsContent>

        <TabsContent value="supervisor" className="mt-6">
          <div className="rounded-xl border bg-card">
            <UsersTable users={supervisorUsers} />
          </div>
        </TabsContent>

        <TabsContent value="user" className="mt-6">
          <div className="rounded-xl border bg-card">
            <UsersTable users={regularUsers} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
