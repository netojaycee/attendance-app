// "use client";

// import {
//   Music,
//   HomeIcon,
//   Calendar,
//   Settings,
//   Bell,
//   Timer,
//   Send,
//   MapPin,
//   Clock,
//   Info,
//   Check,
//   ChevronRight,
//   Star,
// } from "lucide-react";

// export default function Home() {
//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Navigation */}
//       <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 px-6 py-3">
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           {/* Logo */}
//           <div className="flex items-center gap-3">
//             <div className="bg-blue-500 p-2 rounded-lg">
//               <Music className="text-white w-6 h-6" />
//             </div>
//             <h1 className="text-xl font-bold tracking-tight">ChoirSync</h1>
//           </div>

//           {/* Desktop Nav Links */}
//           <div className="hidden md:flex items-center gap-8">
//             <a href="#" className="text-blue-500 font-semibold text-sm flex items-center gap-2">
//               <HomeIcon className="w-5 h-5" />
//               Home
//             </a>
//             <a href="#" className="text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-blue-500 transition-colors flex items-center gap-2">
//               <Calendar className="w-5 h-5" />
//               My Events
//             </a>
//             <a href="#" className="text-slate-500 dark:text-slate-400 font-medium text-sm hover:text-blue-500 transition-colors flex items-center gap-2">
//               <Settings className="w-5 h-5" />
//               Settings
//             </a>
//           </div>

//           {/* Right Actions */}
//           <div className="flex items-center gap-4">
//             <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
//               <Bell className="w-5 h-5" />
//               <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
//             </button>
//             <div className="h-8 w-px bg-slate-200 dark:border-slate-700"></div>
//             <div className="flex items-center gap-3">
//               <div className="text-right hidden sm:block">
//                 <p className="text-sm font-bold leading-none">Alex Johnson</p>
//                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tenor Member</p>
//               </div>
//               <div className="size-10 rounded-full bg-cover bg-center border-2 border-blue-500/20" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCywkteegorhtmv9vCvQnA7Foy1mPM8D9r39Kyuqb9u_irpWX0kCWTa6LNuk3GUFCBxAgre8m2e-NzsYnDyKC5d9rcsulolf7tGzQWkL8yZWXHJpcO5mjJlHQ3WQkkEm5_d87DdhcqxnW8Aa-3nc_WnCZ1XWj5zHxm732QN7OVnctDLbS9YqTkonMWGO6ncblp3AypPLN4PpywmQHE1Qge9m_SGbo8CM54uQ3aO7KEkhnwn25rSPW9w5S-uh4k7elnJQWyB06evr7lX")'}}>
//               </div>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Left Column */}
//           <div className="lg:w-[60%] space-y-6">
//             {/* Welcome Header */}
//             <header>
//               <h2 className="text-3xl font-extrabold tracking-tight mb-2">Welcome back, Alex!</h2>
//               <p className="text-slate-500 dark:text-slate-400">You&apos;re doing great. Don&apos;t forget to check in for tonight&apos;s rehearsal.</p>
//             </header>

//             {/* Event Card */}
//             <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 shadow-sm">
//               <div className="relative h-64 bg-cover bg-center" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCXEfnYIWpTDmM1H86c3hglBnMk00osBG6MZABARYqiQ_0PjHYALFMx59YRdA__BBIu_NVK0HR9PMo0RJjEtZ1TZDeo25ey78wsv7_6aXuyhEoF5gZDtPCifvV6MPvwiORzArLOAXZknbN7Z48mJggGq5bNjZ7w-jPXDho8IfIjz9lEh-dIgRkeEjdgySSzGT1fpVHx1U5Gts2nnVF3vm1z2-Z7sOYPkKnO3_Kuama_WM9D9bndaa7at0getKQFV_O-lvzCbJathHfO")'}}>
//                 <div className="absolute inset-0 bg-linear-to-t from-slate-900/80 to-transparent"></div>
//                 <div className="absolute bottom-6 left-6">
//                   <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold uppercase tracking-widest">Active Now</span>
//                   <h3 className="text-white text-3xl font-bold mt-2">Evening Rehearsal</h3>
//                 </div>
//               </div>
//               <div className="p-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
//                   {/* Event Details */}
//                   <div className="space-y-6">
//                     <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
//                       <Calendar className="w-5 h-5 text-blue-500" />
//                       <span className="font-medium">Monday, Oct 23, 2023</span>
//                     </div>
//                     <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
//                       <Clock className="w-5 h-5 text-blue-500" />
//                       <span className="font-medium">7:00 PM - 9:00 PM (2 hours)</span>
//                     </div>
//                     <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
//                       <MapPin className="w-5 h-5 text-blue-500" />
//                       <span className="font-medium">Main Concert Hall, Stage A</span>
//                     </div>
//                   </div>

//                   {/* Check-in Form */}
//                   <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700/50">
//                     <label className="block mb-3">
//                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Check-in Arrival Time</span>
//                     </label>
//                     <div className="flex gap-3">
//                       <div className="relative flex-1">
//                         <input
//                           type="text"
//                           defaultValue="6:52 PM"
//                           className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg font-semibold"
//                         />
//                         <Timer className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
//                       </div>
//                       <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
//                         <Send className="w-5 h-5" />
//                         Submit
//                       </button>
//                     </div>
//                     <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
//                       <Info className="w-4 h-4" />
//                       Checked in 8 minutes before session start.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Column */}
//           <div className="lg:w-[40%] space-y-6">
//             {/* Attendance Progress Card */}
//             <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-700/50 shadow-sm h-fit">
//               <div className="flex items-center justify-between mb-8">
//                 <h3 className="text-lg font-bold">Attendance Progress</h3>
//                 <span className="text-xs font-bold text-slate-500 uppercase">Semester A</span>
//               </div>
//               <div className="flex flex-col items-center justify-center space-y-6">
//                 {/* Progress Ring */}
//                 <div className="relative flex items-center justify-center">
//                   <svg className="w-48 h-48">
//                     <circle
//                       cx="96"
//                       cy="96"
//                       fill="transparent"
//                       r="88"
//                       stroke="currentColor"
//                       strokeWidth="12"
//                       className="text-slate-100 dark:text-slate-800"
//                     ></circle>
//                     <circle
//                       cx="96"
//                       cy="96"
//                       fill="transparent"
//                       r="88"
//                       stroke="currentColor"
//                       strokeDasharray="552.92"
//                       strokeDashoffset="82.93"
//                       strokeLinecap="round"
//                       strokeWidth="12"
//                       className="text-blue-500 transition-all"
//                       style={{
//                         transform: 'rotate(-90deg)',
//                         transformOrigin: '50% 50%',
//                         transitionProperty: 'stroke-dashoffset',
//                         transitionDuration: '0.35s'
//                       }}
//                     ></circle>
//                   </svg>
//                   <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
//                     <span className="text-5xl font-black tracking-tighter">85%</span>
//                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Overall</span>
//                   </div>
//                 </div>

//                 {/* Progress Stats */}
//                 <div className="w-full space-y-4">
//                   <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
//                     <div className="flex items-center gap-3">
//                       <div className="bg-green-500 rounded-full p-1">
//                         <Check className="text-white w-4 h-4" />
//                       </div>
//                       <span className="text-green-600 dark:text-green-500 font-bold text-sm uppercase tracking-tight">Pass Mark Met</span>
//                     </div>
//                     <span className="text-xs text-green-600/80 dark:text-green-500/80 font-medium">Target: 75%</span>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
//                       <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Attended</p>
//                       <p className="text-2xl font-black">12 <span className="text-sm font-medium text-slate-400">/ 15</span></p>
//                     </div>
//                     <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
//                       <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Missed</p>
//                       <p className="text-2xl font-black text-slate-400">3</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Next Milestone Card */}
//             <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm relative overflow-hidden group cursor-pointer hover:border-blue-500/30 transition-all">
//               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
//                 <Star className="w-16 h-16" />
//               </div>
//               <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.15em] mb-4">Next Milestone</h4>
//               <div className="flex items-start gap-4">
//                 <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
//                   <Calendar className="w-8 h-8" />
//                 </div>
//                 <div className="flex-1">
//                   <p className="text-lg font-bold leading-tight">Winter Concert Preparation</p>
//                   <div className="flex items-center gap-2 mt-2 text-slate-500 dark:text-slate-400 text-sm">
//                     <Calendar className="w-4 h-4" />
//                     <span>Saturday, Oct 28</span>
//                   </div>
//                   <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400 text-sm">
//                     <Clock className="w-4 h-4" />
//                     <span>10:00 AM - 2:00 PM</span>
//                   </div>
//                 </div>
//                 <div className="self-center">
//                   <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
//                 </div>
//               </div>
//               <div className="mt-6">
//                 <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1.5">
//                   <span>Preparation Phase</span>
//                   <span>65%</span>
//                 </div>
//                 <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
//                   <div className="bg-blue-500 h-full rounded-full" style={{width: '65%'}}></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-700/30 mt-auto bg-white dark:bg-slate-950/50">
//         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
//           <p className="text-slate-500 text-sm">© 2023 ChoirSync Dashboard. Professional Version.</p>
//           <div className="flex gap-6 text-sm text-slate-400">
//             <a href="#" className="hover:text-blue-500 transition-colors">Privacy Policy</a>
//             <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
//             <a href="#" className="hover:text-blue-500 transition-colors">Help Center</a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/login");
}
