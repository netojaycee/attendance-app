import { Users, Building2, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventsManagement from "@/components/shared/events/EventsManagement";
import DistrictManagement from "@/components/shared/district/DistrictManagement";
import UsersManagement from "@/components/shared/user/UsersManagement";

export default function ManagementPage() {
  // const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Management
        </h1>

        {/* Tabs */}
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0">
            <TabsTrigger
              value="events"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger
              value="districts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Districts
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white px-4 py-3 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="m-0 mt-4 space-y-3">
            <EventsManagement />
          </TabsContent>

          {/* Districts Tab */}
          <TabsContent value="districts" className="m-0 mt-4 space-y-3">
            <DistrictManagement />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="m-0 mt-4 space-y-4">
            <UsersManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
