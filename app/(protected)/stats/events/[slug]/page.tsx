"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Share2, Search, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserScore {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  score: number;
  voicePart: "SOPRANO" | "ALTO" | "TENOR" | "BASS";
  status: "qualified" | "failed";
}

// Mock data - replace with actual server action
const mockUsers: UserScore[] = [
  {
    id: "1",
    firstName: "Alex",
    lastName: "Chen",
    email: "alex.chen@choirapp.com",
    score: 95,
    voicePart: "SOPRANO",
    status: "qualified",
  },
  {
    id: "2",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "s.johnson@domain.net",
    score: 88,
    voicePart: "ALTO",
    status: "qualified",
  },
  {
    id: "3",
    firstName: "Michael",
    lastName: "Ross",
    email: "m.ross@services.io",
    score: 42,
    voicePart: "TENOR",
    status: "failed",
  },
  {
    id: "4",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.d@choir.org",
    score: 91,
    voicePart: "SOPRANO",
    status: "qualified",
  },
  {
    id: "5",
    firstName: "Jordan",
    lastName: "Smith",
    email: "j.smith@webmail.com",
    score: 58,
    voicePart: "BASS",
    status: "failed",
  },
  {
    id: "6",
    firstName: "Lisa",
    lastName: "Brown",
    email: "lisa.b@music.net",
    score: 93,
    voicePart: "ALTO",
    status: "qualified",
  },
  {
    id: "7",
    firstName: "James",
    lastName: "Wilson",
    email: "j.wilson@choir.org",
    score: 76,
    voicePart: "TENOR",
    status: "qualified",
  },
  {
    id: "8",
    firstName: "Maria",
    lastName: "Garcia",
    email: "m.garcia@services.io",
    score: 45,
    voicePart: "BASS",
    status: "failed",
  },
];

const ITEMS_PER_PAGE = 5;

function getStatusColor(status: "qualified" | "failed"): string {
  return status === "qualified"
    ? "bg-primary/20 dark:bg-primary/10 text-slate-900 dark:text-primary"
    : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
}

function getScoreColor(score: number): string {
  return score >= 80 ? "text-slate-900 dark:text-white" : "text-red-600 dark:text-red-400";
}

function UserRow({ user }: { user: UserScore }) {
  return (
    <div className="flex items-center px-4 py-4 gap-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex flex-col w-1/2 overflow-hidden">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
          {user.email}
        </p>
      </div>
      <div className="w-1/4 text-center">
        <p className={`text-sm font-bold ${getScoreColor(user.score)}`}>
          {user.score}%
        </p>
      </div>
      <div className="w-1/4 flex justify-end">
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${getStatusColor(
            user.status
          )}`}
        >
          {user.status}
        </span>
      </div>
    </div>
  );
}

export default function EventUsersPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [voicePartFilter, setVoicePartFilter] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch = `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesVoice =
        voicePartFilter === "all" || user.voicePart === voicePartFilter;
      return matchesSearch && matchesVoice;
    });
  }, [searchQuery, voicePartFilter]);

  // Pagination
  const displayedUsers = filteredUsers.slice(0, displayCount);
  const hasMore = displayCount < filteredUsers.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + ITEMS_PER_PAGE);
  };

  const handleExport = (type: "all" | "qualified" | "failed") => {
    // TODO: Implement actual export functionality
    console.log(`Exporting ${type} users...`);
    // You can call a server action here to generate and download the file
  };

  return (
    <div className="pb-24 bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-slate-900 dark:text-white flex items-center justify-center w-10 h-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex-1 text-center">
          Event User Scores
        </h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-slate-900 dark:text-white flex items-center justify-center w-10 h-10">
              <Share2 className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DropdownMenuItem
              onClick={() => handleExport("all")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("qualified")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              Export Qualified
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("failed")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              Export Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Export Section */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          Export Data
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Select a category to download the report.
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-slate-900 font-bold w-full justify-between">
              <span>Export Data</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DropdownMenuItem
              onClick={() => handleExport("all")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              Export All Users
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("qualified")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              Export Qualified
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExport("failed")}
              className="text-slate-900 dark:text-white cursor-pointer"
            >
              Export Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters Section */}
      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search members by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </div>

        {/* Voice Part Filter */}
        <Select value={voicePartFilter} onValueChange={setVoicePartFilter}>
          <SelectTrigger className="bg-slate-100 dark:bg-slate-800 border-0 text-slate-900 dark:text-white">
            <SelectValue placeholder="Filter by voice part" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectItem value="all" className="text-slate-900 dark:text-white cursor-pointer">
              All Voice Parts
            </SelectItem>
            <SelectItem value="SOPRANO" className="text-slate-900 dark:text-white cursor-pointer">
              Soprano
            </SelectItem>
            <SelectItem value="ALTO" className="text-slate-900 dark:text-white cursor-pointer">
              Alto
            </SelectItem>
            <SelectItem value="TENOR" className="text-slate-900 dark:text-white cursor-pointer">
              Tenor
            </SelectItem>
            <SelectItem value="BASS" className="text-slate-900 dark:text-white cursor-pointer">
              Bass
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Header */}
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800/50 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
        <span className="w-1/2">Member Details</span>
        <span className="w-1/4 text-center">Score</span>
        <span className="w-1/4 text-right">Status</span>
      </div>

      {/* Users List */}
      {displayedUsers.length > 0 ? (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {displayedUsers.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm">No users found</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="p-4 flex justify-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="w-full border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50 font-bold"
          >
            Load More Users
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
        Showing {displayedUsers.length} of {filteredUsers.length} users
      </div>
    </div>
  );
}
