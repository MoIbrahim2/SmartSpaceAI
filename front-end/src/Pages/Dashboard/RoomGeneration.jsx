import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGeneration } from "../../api";
import Icon from "../../Components/Icon";

const RoomGeneration = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEnhanceForm, setShowEnhanceForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    roomId: "",
    generationType: "CREATE_FROM_SCRATCH",
    prompt: "",
    settings: JSON.stringify({
      creativity: 80,
      preserveLayout: true,
      colorPalette: "light-wood-white-grey",
      lighting: "bright-natural",
      quality: "high",
      aspectRatio: "16:9",
    }),
    images: null,
  });

  const handleCreateScratch = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("generationType", "CREATE_FROM_SCRATCH");
      fd.append("prompt", form.prompt);
      fd.append("settings", form.settings);
      if (form.roomId) fd.append("roomId", form.roomId);
      const { data } = await createGeneration(fd);
      if (data.success) {
        navigate("/projects");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("generationType", "ENHANCE_ROOM");
      fd.append("prompt", form.prompt);
      fd.append("settings", form.settings);
      if (form.roomId) fd.append("roomId", form.roomId);
      if (form.images) {
        for (const file of form.images) {
          fd.append("images", file);
        }
      }
      const { data } = await createGeneration(fd);
      if (data.success) {
        navigate("/projects");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Enhancement failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <main className="relative flex flex-grow flex-col items-center justify-center overflow-hidden bg-background p-8 md:p-12 lg:p-16">
        <div className="relative z-10 mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold uppercase tracking-tight text-on-surface md:text-5xl">
            Room Generation
          </h1>
          <p className="mx-auto max-w-lg text-lg text-on-surface-variant">
            Transform your living spaces with AI-powered interior design. Start from a blank canvas or enhance your existing room photos.
          </p>
        </div>

        {error && (
          <div className="relative z-10 mb-6 w-full max-w-md rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
            {error}
          </div>
        )}

        {!showCreateForm && !showEnhanceForm ? (
          <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
            >
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-primary neomorph-inset">
                <Icon name="auto_awesome" size={48} />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-on-surface">Create from Scratch</h3>
              <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
                Generate entirely new room concepts using our advanced AI engine. Input dimensions, style preferences, and mood.
              </p>
              <div className="rounded-xl px-8 py-3 font-bold text-primary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
                Get Started
              </div>
            </button>

            <button
              onClick={() => setShowEnhanceForm(true)}
              className="group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-background p-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] active:neomorph-inset neomorph-raised"
            >
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-background text-tertiary neomorph-inset">
                <Icon name="photo_camera" size={48} />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-on-surface">Enhance Room</h3>
              <p className="mb-8 text-center leading-relaxed text-on-surface-variant">
                Upload a photo of your current space and let SmartSpace AI reimagine the furniture, lighting, and decor seamlessly.
              </p>
              <div className="rounded-xl px-8 py-3 font-bold text-tertiary transition-all duration-300 group-active:neomorph-inset neomorph-raised">
                Upload Photo
              </div>
            </button>
          </div>
        ) : showCreateForm ? (
          <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-background p-10 neomorph-raised">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-on-surface">Create from Scratch</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface neomorph-inset"
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleCreateScratch}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Prompt</label>
                <textarea
                  className="w-full rounded-2xl border-none bg-background px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neomorph-inset"
                  rows={4}
                  placeholder="Describe your ideal room..."
                  value={form.prompt}
                  onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Room ID (optional)</label>
                <input
                  className="w-full rounded-2xl border-none bg-background px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neomorph-inset"
                  placeholder="Room ID"
                  value={form.roomId}
                  onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
                />
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-background py-4 font-bold text-primary neomorph-raised neomorph-active disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
                {!loading && <Icon name="auto_awesome" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-lg rounded-[2rem] bg-background p-10 neomorph-raised">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-on-surface">Enhance Room</h2>
              <button
                onClick={() => setShowEnhanceForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface neomorph-inset"
              >
                <Icon name="close" />
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleEnhance}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Room Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full rounded-2xl border-none bg-background px-6 py-4 text-on-surface file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white focus:ring-2 focus:ring-primary/20 neomorph-inset"
                  onChange={(e) => setForm((p) => ({ ...p, images: e.target.files }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Prompt (optional)</label>
                <textarea
                  className="w-full rounded-2xl border-none bg-background px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neomorph-inset"
                  rows={3}
                  placeholder="Describe the style you want..."
                  value={form.prompt}
                  onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-on-surface-variant">Room ID (optional)</label>
                <input
                  className="w-full rounded-2xl border-none bg-background px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neomorph-inset"
                  placeholder="Room ID"
                  value={form.roomId}
                  onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
                />
              </div>
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-background py-4 font-bold text-tertiary neomorph-raised neomorph-active disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Enhancing..." : "Enhance"}
                {!loading && <Icon name="photo_camera" />}
              </button>
            </form>
          </div>
        )}

        <div className="pointer-events-none fixed left-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none fixed bottom-1/4 right-0 -z-10 h-96 w-96 rounded-full bg-tertiary/5 blur-[120px]" />
      </main>

      <div className="fixed bottom-8 left-1/2 z-40 flex w-[90%] -translate-x-1/2 items-center justify-around rounded-2xl bg-background p-4 neomorph-raised md:hidden">
        <button className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset" aria-label="Apartments">
          <Icon name="domain" />
        </button>
        <button className="rounded-xl p-3 text-primary transition-all neomorph-inset" aria-label="Room generation">
          <Icon name="auto_awesome" />
        </button>
        <button className="rounded-xl p-3 text-on-surface-variant transition-all active:neomorph-inset" aria-label="Profile">
          <Icon name="person" />
        </button>
      </div>
    </div>
  );
};

export default RoomGeneration;
