import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfile, editProfile } from "../../api";

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getProfile();
        if (data.success && data.data?.user) {
          const u = data.data.user;
          setForm({
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            email: u.email || "",
            dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
          });
          setUser(u);
        }
      } catch {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setUser]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("firstName", form.firstName);
      fd.append("lastName", form.lastName);
      fd.append("dateOfBirth", form.dateOfBirth);
      if (profileImage) fd.append("profileImage", profileImage);
      const { data } = await editProfile(fd);
      if (data.success && data.data?.user) {
        setUser(data.data.user);
        setSuccess("Profile updated successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-bright">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto w-full max-w-[1200px] flex-grow px-6 py-10 md:px-20">
        <div className="flex flex-col gap-12 md:flex-row">
          <aside className="w-full space-y-6 md:w-64">
            <div className="flex flex-col gap-2 rounded-3xl bg-surface-bright p-6 neo-shadow">
              <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-bold text-primary neo-inset">
                <span className="material-symbols-outlined">person</span>
                <span>Profile</span>
              </button>
              <Link
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-on-surface-variant transition-all hover:text-primary neo-button"
                to="/credits"
              >
                <span className="material-symbols-outlined">payments</span>
                <span>Billing</span>
              </Link>
            </div>
          </aside>

          <section className="flex-grow">
            <div className="rounded-3xl bg-surface-bright p-8 neo-shadow md:p-12">
              {error && (
                <div className="mb-6 rounded-xl bg-error/10 px-5 py-3 text-sm font-medium text-error">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 rounded-xl bg-success/10 px-5 py-3 text-sm font-medium text-success">
                  {success}
                </div>
              )}
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="flex flex-col items-start gap-4">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant">Profile Photo</label>
                  <div className="flex items-center gap-8">
                    <div className="group relative">
                      <div className="h-32 w-32 rounded-full p-2 neo-inset">
                        <div className="relative h-full w-full overflow-hidden rounded-full neo-shadow">
                          <img
                            className="h-full w-full object-cover"
                            alt="Profile"
                            src={
                              profileImage
                                ? URL.createObjectURL(profileImage)
                                : user?.profileImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDiLUchOQJez1yJGaA_8LNiL93_YXiYpDBZqIm0Lp7dFkEKnSfb1CYDyV_3bENypNDic3lxNErAWmlHwLssd4YjVxFta4M83i720zSao8f07KmA1-x_H0DKBmhBZlVLRNP987IISxMs8FiUJ_lzfsoHe9Kyzs9GG7axLBBZjyiIgVSoYOrtH9gKbaf9LSh7_Y5BkbqmaC7Hb6TrXvWmpDgzm8lU3Kg7CBxMzV_GTrIaNm2siMP1aDRa"
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white neo-shadow neo-button"
                        aria-label="Edit profile photo"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="rounded-full bg-surface-bright px-6 py-2 text-sm font-bold text-primary neo-shadow neo-button"
                      >
                        Upload New Photo
                      </button>
                      <p className="text-xs font-medium text-on-surface-variant">JPG, GIF or PNG. Max size 2MB</p>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="first_name">First Name</label>
                    <input
                      className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                      id="first_name"
                      type="text"
                      autoComplete="given-name"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="last_name">Last Name</label>
                    <input
                      className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                      id="last_name"
                      type="text"
                      autoComplete="family-name"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="email">Email Address</label>
                  <input
                    className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                    id="email"
                    type="email"
                    value={form.email}
                    disabled
                  />
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className="px-1 text-sm font-semibold text-on-surface-variant" htmlFor="dob">Date of Birth</label>
                    <div className="relative">
                      <input
                        className="w-full rounded-2xl border-none bg-surface-bright px-6 py-4 text-on-surface placeholder-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 neo-inset"
                        id="dob"
                        type="date"
                        autoComplete="bday"
                        name="dateOfBirth"
                        value={form.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sm font-bold text-error transition-colors hover:text-error/80"
                  >
                    Discard changes
                  </button>
                  <button
                    className="rounded-full bg-surface-bright px-10 py-3 font-bold tracking-wide text-primary neo-shadow neo-button disabled:opacity-50"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Profile;
