import { CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AllRoles, UserRoleLabel } from "@/lib/userRoles";
import { Search } from "lucide-react";

interface TableHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
}

export function EmployeeTableHeader({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
}: TableHeaderProps) {
  return (
    <CardHeader className="flex flex-row flex-wrap items-center justify-between mb-3 pb-0">
      <h2 className="text-xl font-semibold text-gray-800 w-fit">
        Employee Directory
      </h2>
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone"
            className="pl-10 pr-4 py-2 bg-white border border-indigo-300 rounded-lg w-full text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {AllRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {UserRoleLabel[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </CardHeader>
  );
}
