import React, { useState, useEffect } from 'react';
import "../css/imageupload.css";

function ImageUploadComponent({ index, form, handleImageChange, fileInputRefs, imageName }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (form.image) {
      const previewUrl = URL.createObjectURL(form.image);
      setImagePreview(previewUrl);

      return () => URL.revokeObjectURL(previewUrl); // Clean up URL object
    } else {
      setImagePreview(null);
    }
  }, [form.image]);

  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageChange(index, file); // Call the handleImageChange function from props
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageChange(index, file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if ((form.manDays && !form.collapsed)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className='image-upload'>
      <div
        className={`image-upload-container ${isDragging ? 'dragging' : ''}`}
        onClick={() => (form.manDays && !form.collapsed) && fileInputRefs.current[index].click()}
        onDragOver={(form.manDays && !form.collapsed) ? handleDragOver : null}
        onDragLeave={(form.manDays && !form.collapsed) ? handleDragLeave : null}
        onDrop={(form.manDays && !form.collapsed) ? handleDrop : null}
        style={{ cursor: (form.manDays && !form.collapsed) ? 'pointer' : 'not-allowed' }}
      >
        <div className={`image-upload-box ${(form.manDays && !form.collapsed) ? 'active' : 'disabled'}`}>
          {imagePreview ? (
            <img src={imagePreview} alt="Image Preview" className="image-preview" />
          ) : (
            <div className="image-upload-placeholder">
              <span className="plus-sign">+</span>
              {/* <p>Upload or Drag Image Here</p> */}
            </div>
          )}
        </div>
        <input
          type="file"
          onChange={onImageChange}
          style={{ display: 'none' }}
          ref={el => fileInputRefs.current[index] = el}
        />
        {imageName && <div className="image-filename">File: {imageName}</div>}
      </div>
    </div>
  );
}

export default ImageUploadComponent;
