
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

export default async function Home() {
  return null;
}