"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Linkedin } from "lucide-react";

const PAGE_SIZE = 5;

export default function JobRecommendationPage() {
  const [allJobs, setAllJobs] = useState([]); // full generated batch
  const [visibleJobs, setVisibleJobs] = useState([]); // paginated slice shown
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filters
const [salary, setSalary] = useState("");
const [selectedLocation, setSelectedLocation] = useState("India");
const [workType, setWorkType] = useState("");


  const sentinelRef = useRef(null);

  // fetch once
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/Job");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data.jobs)) {
          setError(data.error || "Failed to fetch job suggestions");
          setAllJobs([]);
          setVisibleJobs([]);
          setLoading(false);
          return;
        }
        setAllJobs(data.jobs);
        setVisibleJobs(data.jobs.slice(0, PAGE_SIZE));
      } catch (err) {
        console.error(err);
        setError("Network error while fetching jobs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // load next page locally
  const loadMore = useCallback(() => {
    if (loadingMore) return;
    const nextPage = page + 1;
    const start = (nextPage - 1) * PAGE_SIZE;
    const nextSlice = allJobs.slice(start, start + PAGE_SIZE);
    if (nextSlice.length === 0) return; // nothing to load
    setLoadingMore(true);
    // small timeout for UX (simulate network)
    setTimeout(() => {
      setVisibleJobs((prev) => [...prev, ...nextSlice]);
      setPage(nextPage);
      setLoadingMore(false);
    }, 400);
  }, [page, allJobs, loadingMore]);

  // intersection observer to auto-load when sentinel visible
  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loading && !loadingMore) {
            const hasMore = visibleJobs.length < allJobs.length;
            if (hasMore) loadMore();
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 0.4 }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [visibleJobs, allJobs, loading, loadingMore, loadMore]);

  // Save job function
  async function handleSave(job) {
    try {
      const res = await fetch("/api/saved-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.jobTitle,
          reason: job.whyGoodFit,
          keySkills: job.keySkills,
          salaryRange: job.salaryRange || "",
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      // optional: toast instead of alert
      alert("✅ Job saved to favorites!");
    } catch (e) {
      console.error(e);
      alert("❌ Could not save job. Are you signed in?");
    }
  }

  if (loading) {
    return <p className="text-center text-lg font-medium mt-10">Loading suggestions...</p>;
  }
  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 font-semibold mb-4">{error}</p>
        <button onClick={() => location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded">
          Retry
        </button>
      </div>
    );
  }
const location = selectedLocation || "India";
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold mb-8 text-center text-pink-500">🎯 AI Job Recommendations</h2>

      {/* Filters */}
<div className="flex flex-wrap gap-4 justify-center mb-8">

  {/* Salary Filter */}
  <select
    className="bg-gray-800 text-white px-3 py-2 rounded-lg"
    onChange={(e) => setSalary(e.target.value)}
  >
    <option value="">Salary</option>
    <option value="3-6">3LPA - 6LPA</option>
    <option value="6-10">6LPA - 10LPA</option>
    <option value="10-20">10LPA - 20LPA</option>
  </select>

  {/* Location Filter */}
  <select
  className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-sm text-white"
  value={selectedLocation}
  onChange={(e) => setSelectedLocation(e.target.value)}
>
  <option value="">📍 Location</option>
  <option value="India">India (Default)</option>
  <option value="Delhi">Delhi</option>
  <option value="Mumbai">Mumbai</option>
  <option value="Pune">Pune</option>
  <option value="Bangalore">Bangalore</option>
  <option value="Hyderabad">Hyderabad</option>
  <option value="Remote">Remote</option>
</select>


  {/* Work Type Filter */}
  <select
    className="bg-gray-800 text-white px-3 py-2 rounded-lg"
    onChange={(e) => setWorkType(e.target.value)}
  >
    <option value="">Work Mode</option>
    <option value="remote">Remote</option>
    <option value="hybrid">Hybrid</option>
    <option value="onsite">Onsite</option>
  </select>
</div>



      <div className="grid gap-8">
        {visibleJobs
  .filter((job) => {
    if (salary) {
      const [min, max] = salary.split("-").map(Number);
      const jobSalary = job.salaryRange?.match(/\d+/g);
      if (!jobSalary) return false;
      const salaryVal = Number(jobSalary[0]);
      if (salaryVal < min || salaryVal > max) return false;
    }

    if (location && job.location && !job.location.includes(location)) {
      return false;
    }

    if (workType && job.workMode && job.workMode !== workType) {
      return false;
    }

    return true;
  })
  .map((job, idx) => (


          <div key={idx} className="bg-gray-900 text-gray-100 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-2">{job.jobTitle || "Unknown Role"}</h3>
                <p className="text-green-400 font-medium mb-2">
                  ✅ <span className="text-gray-200 leading-relaxed"><strong>Why:</strong> {job.whyGoodFit || "Not available"}</span>
                </p>
                <p className="text-pink-400 font-medium mb-2">
                  🎯 <span className="text-gray-200"><strong>Difficulty:</strong> {job.difficultyLevel || "Medium"}</span>
                </p>
                {job.salaryRange && <p className="text-sm text-gray-300 mb-2">💰 {job.salaryRange}</p>}

                {Array.isArray(job.keySkills) && job.keySkills.length > 0 && (
                  <div className="mt-3">
                    <p className="text-green-300 font-semibold mb-1">🧩 Key Skills:</p>
                    <ul className="list-disc pl-6 space-y-1 text-gray-300 text-sm">
                      {job.keySkills.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-3 justify-end">

  {/* LinkedIn */}
<a
  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.jobTitle)}&location=${encodeURIComponent(location)}`}
  target="_blank"
  rel="noreferrer"
  className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
  title="Search on LinkedIn"
>
  🔗
</a>

{/* Naukri */}
<a
  href={`https://www.naukri.com/${encodeURIComponent(job.jobTitle)}-jobs-in-${encodeURIComponent(location)}`}
  target="_blank"
  rel="noreferrer"
  className="p-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md"
  title="Search on Naukri.com"
>
  🧿
</a>

{/* Indeed */}
<a
  href={`https://in.indeed.com/jobs?q=${encodeURIComponent(job.jobTitle)}&l=${encodeURIComponent(location)}`}
  target="_blank"
  rel="noreferrer"
  className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
  title="Search on Indeed"
>
  💼
</a>

{/* Apna */}
<a
  href={`https://apna.co/jobs?keyword=${encodeURIComponent(job.jobTitle)}&location=${encodeURIComponent(location)}`}
  target="_blank"
  rel="noreferrer"
  className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-md"
  title="Search on Apna"
>
  📱
</a>

</div>

            </div>
          </div>
        ))}
      </div>

      {/* sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-8 mt-6 flex items-center justify-center">
        {visibleJobs.length < allJobs.length ? (
          loadingMore ? (
            <p className="text-gray-500">Loading more suggestions...</p>
          ) : (
            <p className="text-gray-500">Scroll to load more...</p>
          )
        ) : (
          <p className="text-gray-500">No more suggestions</p>
        )}
      </div>
    </div>
  );
}
