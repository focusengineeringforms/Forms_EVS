import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, FileText, LayoutGrid, Sun, Moon } from "lucide-react";
import { apiClient } from "../../api/client";
import { useTheme } from "../../context/ThemeContext";

interface Form {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  sections?: any[];
}

interface CustomerFormsListProps {
  tenantSlug: string;
}

export default function CustomerFormsList({
  tenantSlug,
}: CustomerFormsListProps) {
  const [allForms, setAllForms] = useState<Form[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { darkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await apiClient.getPublicForms(tenantSlug);
        const activeForms = response.forms.filter(
          (form) => form.isActive === true
        );
        setAllForms(activeForms);
        setForms(activeForms);
      } catch (err) {
        setError("Failed to load forms");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [tenantSlug]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setForms(allForms);
    } else {
      const filtered = allForms.filter((form) => {
        const query = searchQuery.toLowerCase();
        const titleMatch = form.title.toLowerCase().includes(query);
        const descMatch = form.description.toLowerCase().includes(query);
        const questionMatch =
          form.sections?.some((section: any) =>
            section.questions?.some((q: any) =>
              q.text.toLowerCase().includes(query)
            )
          ) || false;
        return titleMatch || descMatch || questionMatch;
      });
      setForms(filtered);
    }
  }, [searchQuery, allForms]);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'} flex flex-col items-center justify-center gap-3 transition-colors duration-300`}>
        <div className="relative">
          <div className={`h-10 w-10 rounded-full border-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'} border-t-blue-500 animate-spin`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <LayoutGrid className="h-4 w-4 text-blue-500" />
          </div>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest animate-pulse">Loading Workspace</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'} flex items-center justify-center p-4 transition-colors duration-300`}>
        <div className={`max-w-sm w-full ${darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100'} border rounded-xl p-6 text-center`}>
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${darkMode ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600'} mb-3`}>
            <Search className="h-5 w-5" />
          </div>
          <h3 className={`text-[13px] font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'} mb-1`}>Connection Error</h3>
          <p className={`text-[11px] ${darkMode ? 'text-red-400/80' : 'text-red-500'} mb-5 font-medium`}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'} selection:bg-blue-500/30 transition-colors duration-300`}>
      <header className={`sticky top-0 z-50 border-b ${darkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/80'} backdrop-blur-xl transition-colors duration-300`}>
        <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <FileText className="h-4 w-4" />
            </div>
            <span className={`text-base font-black tracking-tighter uppercase ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Focus <span className={`text-blue-500 text-[9px] font-bold align-top border ${darkMode ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-200 bg-blue-50'} px-1 rounded ml-0.5`}>PRO</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className={`h-3.5 w-3.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'} group-focus-within:text-blue-500 transition-colors`} />
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-44 sm:w-56 ${
                  darkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-700 focus:bg-slate-900' 
                    : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                } border rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all duration-300`}
              />
            </div>

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md border ${darkMode ? 'border-slate-800 bg-slate-900 text-slate-500 hover:text-white hover:border-slate-700' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-900 hover:border-slate-300'} transition-all duration-300`}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative px-6 pt-8 pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-0.5">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Available Modules
              </h2>
              <div className="h-0.5 w-8 bg-blue-500 rounded-full" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${darkMode ? 'bg-slate-900 text-slate-500 border border-slate-800' : 'bg-white text-slate-400 border border-slate-200'}`}>
              {forms.length} Total
            </span>
          </div>

          {forms.length === 0 ? (
            <div className={`relative overflow-hidden rounded-xl border border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/20' : 'border-slate-300 bg-white'} px-6 py-16 text-center`}>
              <div className="relative">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? 'bg-slate-900 text-slate-700' : 'bg-slate-50 text-slate-300'} text-xl mb-4`}>
                  {searchQuery ? <Search className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </div>
                <h2 className={`text-[13px] font-bold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'} mb-2`}>
                  {searchQuery ? "No results found" : "No active modules"}
                </h2>
                <p className={`text-slate-500 text-[11px] font-medium max-w-xs mx-auto leading-relaxed`}>
                  {searchQuery
                    ? `We couldn't find any resources matching your search "${searchQuery}".`
                    : "There are currently no active modules available for your account."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {forms.map((form) => (
                <Link
                  key={form.id}
                  to={`/${tenantSlug}/forms/${form.id}`}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-lg border ${darkMode ? 'border-slate-800 bg-slate-900/30 hover:border-blue-500/50 hover:bg-slate-900/60' : 'border-slate-200 bg-white hover:border-blue-500/40 hover:bg-slate-50/50'} p-4 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <ArrowRight className={`h-3.5 w-3.5 ${darkMode ? 'text-slate-700 group-hover:text-blue-400' : 'text-slate-300 group-hover:text-blue-500'} transition-all transform group-hover:translate-x-1`} />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-[13px] font-bold transition-colors ${darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'}`}>
                      {form.title}
                    </h3>
                    {form.description && (
                      <p className={`text-[11px] font-medium leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-500 group-hover:text-slate-600'} transition-colors`}>
                        {form.description}
                      </p>
                    )}
                  </div>

                  <div className={`mt-4 pt-3 border-t ${darkMode ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-600 group-hover:text-blue-500/70' : 'text-slate-400 group-hover:text-blue-500/70'}`}>
                        Start Module
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
