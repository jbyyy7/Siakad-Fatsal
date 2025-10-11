import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types';

interface AnnouncementFormProps {
  announcement: Announcement | null;
  onClose: () => void;
  onSave: (formData: { title: string, content: string }) => Promise<void>;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ announcement, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
      });
    }
  }, [announcement]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Judul dan isi pengumuman tidak boleh kosong.");
      return;
    }
    setIsLoading(true);
    await onSave(formData);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Judul</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">Isi Pengumuman</label>
        <textarea
          id="content"
          name="content"
          rows={5}
          value={formData.content}
          onChange={handleChange}
          required
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      <div className="flex justify-end pt-4 space-x-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:bg-brand-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </form>
  );
};

export default AnnouncementForm;
