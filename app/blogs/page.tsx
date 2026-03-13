"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const blogSampleData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Content Management Blog ${i + 1}`,
    date: new Date(2024, 4, i + 1).toLocaleDateString(),
    status: i % 3 === 0 ? "Draft" : "Published",
  }))

  

export default function AdminDashboard() {
    const [blogContent, setBlogContent] = useState("")
    const [blogsCurrentPage, setBlogsCurrentPage] = useState(1)
  const [blogsItemsPerPage, setBlogsItemsPerPage] = useState(5)

   // Helper functions for pagination
   const getBlogsForCurrentPage = () => {
    const startIndex = (blogsCurrentPage - 1) * blogsItemsPerPage
    const endIndex = startIndex + blogsItemsPerPage
    return blogSampleData.slice(startIndex, endIndex)
  }
  const totalBlogsPages = Math.ceil(blogSampleData.length / blogsItemsPerPage)

    return (
      <DashboardLayout>
        <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Upload New Blog Section */}
        <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Blog</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="blog-title">Enter Blog Title</Label>
                    <Input id="blog-title" placeholder="Enter a compelling title..." className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blog-content">Write or paste your blog content here</Label>
                    <textarea
                      placeholder="Start writing your blog content..."
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full min-h-[250px] p-3 bg-white border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blog-tags">Add tags separated by commas</Label>
                    <Input id="blog-tags" placeholder="content, management, blog..." className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload blog cover image</Label>
                    <div className="flex items-center space-x-4">
                      <Input id="blog-image" type="file" className="w-auto bg-white" />
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Save as Draft</Button>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">Publish</Button>
                  </div>
                </div>
              </div>

              {/* Manage Existing Blogs Section */}
              <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Manage Existing Blogs</h2>
                  <div className="flex items-center justify-between space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Search blogs by title or date" className="bg-white pl-10 border border-indigo-300 rounded-lg text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="blogs-per-page" className="text-sm whitespace-nowrap">
                        Rows per page:
                      </Label>
                      <Select
                        value={blogsItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setBlogsItemsPerPage(Number.parseInt(value))
                          setBlogsCurrentPage(1) // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger className="w-[80px] bg-white">
                          <SelectValue placeholder="5" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">

                  <div className="bg-white rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-indigo-700">
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Thumbnail
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Name
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Date
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-white text-right [&:hover]:text-white hover:bg-transparent">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getBlogsForCurrentPage().map((blog) => (
                          <TableRow key={blog.id} className="hover:bg-transparent">
                            <TableCell>
                              <div className="h-12 w-20 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={`/placeholder.svg?height=48&width=80`}
                                  alt="Blog thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{blog.title}</TableCell>
                            <TableCell>{blog.date}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  blog.status === "Published"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {blog.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">{(blogsCurrentPage - 1) * blogsItemsPerPage + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(blogsCurrentPage * blogsItemsPerPage, blogSampleData.length)}
                        </span>{" "}
                        of <span className="font-medium">{blogSampleData.length}</span> blogs
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => setBlogsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={blogsCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalBlogsPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={page === blogsCurrentPage ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setBlogsCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                          onClick={() => setBlogsCurrentPage((prev) => Math.min(prev + 1, totalBlogsPages))}
                          disabled={blogsCurrentPage === totalBlogsPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
              </div>
              </div>
      </DashboardLayout>
  )
}