import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Modules/SupabaseClient';
import styles from './AddListing.module.css';
import { FaArrowLeft, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';

const AddListing = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    Make: '',
    Model: '',
    Year: '',
    StartingPrice: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Authenticate user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to create a listing.");

      if (!imageFile) throw new Error("Please upload an image for the vehicle.");

      // 2. Upload Image to Supabase Storage 'Images' bucket
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('Images')
        .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
        });

      if (uploadError) throw new Error(`Image Upload Failed: ${uploadError.message}`);

      // 3. Create a Signed URL (since the bucket is private)
      // Setting expiration to 10 years (in seconds) so it acts like a secure persistent link 
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('Images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);
        
      if (signedUrlError) throw new Error(`URL Generation Failed: ${signedUrlError.message}`);
        
      const ImageURL = signedUrlData.signedUrl;

      // 4. Insert into listings table
      const priceNum = parseFloat(formData.StartingPrice);
      
      const { error: insertError } = await supabase
        .from('listings')
        .insert({
          userid: user.id,
          Make: formData.Make,
          Model: formData.Model,
          Year: formData.Year,
          StartingPrice: priceNum,
          CurrentPrice: priceNum, // Starts same as highest
          ImageURL: ImageURL
        });

      if (insertError) throw new Error(`Database Insert Failed: ${insertError.message}`);

      // Complete!
      navigate('/dashboard');
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        
        <div className={styles.headerRow}>
          <h1 className={styles.title}>List New Vehicle</h1>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')} type="button">
            <FaArrowLeft /> Back to Dashboard
          </button>
        </div>

        {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          
          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Make</label>
              <input 
                type="text" 
                name="Make" 
                placeholder="e.g. Porsche" 
                className={styles.input}
                value={formData.Make}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Model</label>
              <input 
                type="text" 
                name="Model" 
                placeholder="e.g. 911 GT3 RS" 
                className={styles.input}
                value={formData.Model}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Year</label>
              <input 
                type="text" 
                name="Year" 
                placeholder="e.g. 2023" 
                className={styles.input}
                value={formData.Year}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Starting Price (ZAR)</label>
              <input 
                type="number" 
                name="StartingPrice" 
                placeholder="e.g. 2150000" 
                className={styles.input}
                value={formData.StartingPrice}
                onChange={handleInputChange}
                required 
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Vehicle Image</label>
            <div className={styles.fileInputContainer}>
              <label className={styles.fileLabel}>
                <FaCloudUploadAlt className={styles.uploadIcon} />
                <span>Click to browse or drag and drop an image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className={styles.fileInput} 
                  onChange={handleFileChange}
                />
              </label>
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className={styles.previewImage} />
              )}
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <><FaSpinner className="fa-spin" /> Uploading...</> : 'Publish Listing'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddListing;
