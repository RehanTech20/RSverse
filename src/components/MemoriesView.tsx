import React, { useState } from 'react';
import { Calendar, Camera, Heart, Plus, Trash2, Upload, X } from 'lucide-react';
import { compressImageFile } from '../lib/imageCompress';
import type { MemoryItem } from '../types/rsverse';

interface MemoriesViewProps {
  memories: MemoryItem[];
  onAddMemory: (payload: {
    title: string;
    caption: string;
    personalNote: string;
    specialDate: string;
    imageData: string;
  }) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const MemoriesView: React.FC<MemoriesViewProps> = ({
  memories,
  onAddMemory,
  onToggleFavorite,
  onDeleteMemory,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [specialDate, setSpecialDate] = useState(new Date().toISOString().slice(0, 10));
  const [imageData, setImageData] = useState('');
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = memories.filter((m) => filter === 'all' || m.isFavorite);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file, 1600, 0.85);
      setImageData(compressed);
    } catch (err: any) {
      setError(err.message || 'Could not process image.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageData) {
      setError('Please upload a photo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAddMemory({ title, caption, personalNote, specialDate, imageData });
      setTitle('');
      setCaption('');
      setPersonalNote('');
      setImageData('');
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Could not save memory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 pb-20 md:pb-10">
      {/* Banner */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#130F24] min-h-[210px] flex items-end">
        <img
          src="/src/assets/images/memories_cover_art_1795022089944.jpg"
          alt="Private memories album"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-[#0A0714]/70 to-transparent" />
        <div className="relative z-10 w-full p-6 sm:p-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Our Memory Timeline</h1>
            <p className="text-sm text-slate-300 mt-1">
              Save favorite photos, milestones, special dates, and private notes together.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Memory'}
          </button>
        </div>
      </section>

      {/* Add Memory Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Preserve a New Memory
          </h2>
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-sm text-rose-500">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Memory Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Late Night Stargazing"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Special Date
              </label>
              <input
                type="date"
                required
                value={specialDate}
                onChange={(e) => setSpecialDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="A short summary of the moment"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Personal Note
            </label>
            <textarea
              rows={3}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Write a personal note or story behind this memory..."
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
              <Upload className="w-4 h-4" />
              {compressing ? 'Optimizing Photo...' : imageData ? 'Change Photo' : 'Choose Photo'}
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {imageData && (
              <div className="relative inline-block">
                <img
                  src={imageData}
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/15"
                />
                <button
                  type="button"
                  onClick={() => setImageData('')}
                  aria-label="Remove selected photo"
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || compressing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Memory'}
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            filter === 'all'
              ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          All Memories ({memories.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('favorites')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            filter === 'favorites'
              ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Favorites ({memories.filter((m) => m.isFavorite).length})
        </button>
      </div>

      {/* Memories Grid */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-12 text-center space-y-3">
          <Camera className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200">
            No memories saved yet
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Upload your first photo and personal note to start building your private timeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] flex flex-col justify-between"
            >
              <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                <img
                  src={m.imageUrl}
                  alt={m.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-mono-tabular">
                      <Calendar className="w-3.5 h-3.5" />
                      {m.specialDate}
                    </span>
                    <span>By {m.authorUsername}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {m.title}
                  </h3>
                  {m.caption && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">{m.caption}</p>
                  )}
                  {m.personalNote && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      {m.personalNote}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(m.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                      m.isFavorite ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${m.isFavorite ? 'fill-rose-500' : ''}`} />
                    {m.isFavorite ? 'Favorited' : 'Favorite'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteMemory(m.id)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
