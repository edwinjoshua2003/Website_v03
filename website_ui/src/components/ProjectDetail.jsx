import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AxiosInstance from './AxiosInstance';
import Header from './Header';
import ImageUploadComponent from './ImageUploadComponent';
import "../css/projectdetail.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faPlus, faPencilAlt, faUndoAlt } from '@fortawesome/free-solid-svg-icons';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRefs = useRef([]);
  const [projectInfo, setProjectInfo] = useState({ name: '', bannerUrl: '' });

  const initialFormState = {
    assetType: '',
    assetName: '',
    process: '',
    status: '',
    cManDays:'',
    manDays: '',
    image: null,
    imageName: '',
    description: '',
    collapsed: false,
    prefilled: false,
    tracked: false
  };
  // const initialFormStateRef = useRef(initialFormState);

  const [forms, setForms] = useState([initialFormState]);
  const [assetTypeOptions, setAssetTypeOptions] = useState([]);
  const [assetNameOptions, setAssetNameOptions] = useState({});
  const [processOptions, setProcessOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [formErrors, setFormErrors] = useState([]);
  const trackingFormsRef = useRef([]);
  
  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = '';
    }
  };


  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchProjectData = async () => {
      try {
        // Fetch the project details and the asset tracking data for WIP and Hold
        const projectResponse = await AxiosInstance.get(`/api/project/${id}/`, {
          signal: controller.signal,
        });
        const { project_name, assets, types, phases, status } = projectResponse.data;
    
        // Fetch the user's log entries for the current date
        const userLogsResponse = await AxiosInstance.get(`/api/daily_log/${id}/`, {
          signal: controller.signal,
        });
        const userLogs = userLogsResponse.data;

        // Fetch the asset tracking data for WIP and Hold statuses
        const trackingResponse = await AxiosInstance.get(`/api/asset_tracking/${id}/`, {
          signal: controller.signal,
        });
        const trackingData = trackingResponse.data; // Assuming it returns an array of asset tracking records
    
        // Store tracking forms in the ref
        trackingFormsRef.current = trackingData
        .filter(item => item.status_id === 2 || item.status_id === 7)
        .map(item => ({
          assetType: item.asset_type_id, 
          assetName: item.asset_name, 
          process: item.phase_id, 
          status: item.status_id, 
          manDays: item.man_days || '', 
        }));

        setProjectInfo({
          name: project_name,
          bannerUrl: `../project_icon_without_title/${id}_icon.jpg`, // Assuming project has a banner image URL
        });
    
        setAssetTypeOptions(types);
        setProcessOptions(phases);
        setStatusOptions(status);
        setAssetNameOptions(
          assets.reduce((acc, asset) => {
            acc[asset.asset_type_id] = acc[asset.asset_type_id] || [];
            acc[asset.asset_type_id].push(asset.asset_name);
            return acc;
          }, {})
        );

        // Pre-fill forms with the user's current day log entries, including fetching image Blob
        const prefilledForms = await Promise.all(
          userLogs.map(async (log) => {
            let imageBlob = null;
            if (log.image_url) {
              const response = await fetch(`${AxiosInstance.defaults.baseURL}/api/image/${log.image_url}`);
              const blob = await response.blob();
              imageBlob = new File([blob], log.image_url.split('/').pop(), { type: blob.type });
            }
    
            return {
              assetType: log.asset_type_id,
              assetName: log.asset_name,
              process: log.phase_id,
              status: log.status_id,
              cManDays: log.c_man_days || '',
              manDays: log.man_days || '',
              description: log.description || '',
              image: imageBlob, // Initialize image as a File object
              // imageName: imageBlob ? imageBlob.name : '',
              imageName: '',
              collapsed: true,
              prefilled: true,
              tracked: false
            };
          })
        );
    
        // Set the forms state with prefilled logs
        setForms(prefilledForms.length > 0 ? prefilledForms : [initialFormState]);
    
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.log(error.name)
          console.error('Error fetching project data:', error);
        }
      }
    };
    
    fetchProjectData();
    
    // Cleanup function to abort the request when component unmounts
    return () => {
      controller.abort();
    };    
  
  }, [id, setProjectInfo]);

  useEffect(() => {
    fileInputRefs.current = fileInputRefs.current.slice(0, forms.length);
  }, [forms]);

  const handleInputChange = (index, field, value) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    console.log(value)
  
    if (field === 'assetType') {
      newForms[index].assetName = '';
      newForms[index].process = '';
      newForms[index].status = '';
      newForms[index].manDays = '';
    } else if (field === 'assetName') {
      newForms[index].process = '';
      newForms[index].status = '';
      newForms[index].manDays = '';
    } else if (field === 'process') {
      newForms[index].status = '';
      newForms[index].manDays = '';
  
      console.log(trackingFormsRef.current)
      // Automatically fill status and manDays if matching tracking form is found
      const matchingForm = trackingFormsRef.current.find(
        (form) =>
          form.assetType === newForms[index].assetType &&
          form.assetName === newForms[index].assetName &&
          form.process === value
      );
      console.log(matchingForm)
  
      if (matchingForm) {
        newForms[index].status = matchingForm.status;
        newForms[index].manDays = matchingForm.manDays;
      }
    }
  
    setForms(newForms);
    setHasUnsavedChanges(true);
  };  

  const handleImageChange = (index, file) => {
    const newForms = [...forms];
    newForms[index] = { ...newForms[index], image: file, imageName: file.name};
    console.log(file)
    setForms(newForms);
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = forms.map(validateForm);
    const hasErrors = errors.some((error) => !Object.values(error).every((isValid) => isValid));

    // If there are errors, set them and prevent submission
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    try {
      const updatedForms = await Promise.all(
        forms.map(async (form, index) => {
          // Skip submission if form.prefilled is true
          if (form.prefilled) {
            return form; // Skip to the next form and return unchanged
          }

          const formData = new FormData();
          formData.append('assetType', form.assetType);
          formData.append('assetName', form.assetName);
          formData.append('process', form.process);
          formData.append('status', form.status);
          formData.append('manDays', form.manDays);
          formData.append('description', form.description);
          if (form.image) {
            formData.append('image', form.image);
          }

          await AxiosInstance.post(`/api/daily_log/${id}/`, formData);

          // After successful submission, mark the form as prefilled and collapsed
          return {
            ...form,
            prefilled: true,  // Mark as prefilled after successful submission
            collapsed: true,  // Collapse the form after submission
          };
        })
      );

      alert('Log entries created successfully!');
      setForms(updatedForms); // Update forms with the submitted and prefilled data
      setHasUnsavedChanges(false); // Reset unsaved changes flag
      setFormErrors([]); // Clear form errors

    } catch (error) {
      console.error('Error creating log entries:', error);
      alert('Failed to create log entries.');
    }
  };

  const addForm = () => {
    const newForms = forms.map((form) => ({ ...form, collapsed: true }));
    newForms.push({ ...initialFormState, collapsed: false });
    setForms(newForms);
    setHasUnsavedChanges(true);
  };

  const deleteForm = (index) => {
    const newForms = forms.filter((_, i) => i !== index);

    // Adjust the file input references after deleting a form
    fileInputRefs.current = fileInputRefs.current.filter((_, i) => i !== index);

    setForms(newForms);
    setHasUnsavedChanges(true);
  };

  const clearForm = (index) => {
    const newForms = [...forms];
    newForms[index] = { ...initialFormState, image: null };

    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
    setForms(newForms);
    setHasUnsavedChanges(true);
  };

  const toggleCollapse = (index) => {
    const newForms = forms.map((form, i) => ({
      ...form,
      collapsed: i !== index ? true : !form.collapsed,
    }));
    setForms(newForms);
    setHasUnsavedChanges(true);
  };

  const validateForm = (form) => {
    const validation = {
      assetType: !!form.assetType,
      assetName: !!form.assetName,
      process: !!form.process,
      status: !!form.status,
      manDays: !!form.manDays,
      description: !!form.description,
      image: !!form.image,
    };
  
    return Object.values(validation).every(value => value);
  };

  const isFormValid = forms.every(validateForm);
  const isAllPrefilled = forms.every(form => form.prefilled);

  const getInputClassName = (index, field) => {
    return formErrors[index] && formErrors[index][field] === false ? 'error-border' : '';
  };

  return (
    <div className='pd'>
      <Header />
      {/* Banner section */}
      <div className="project-banner">
        {projectInfo.bannerUrl ? (
          <img src={projectInfo.bannerUrl} alt={`${projectInfo.name} Banner`} className="project-banner-image" />
        ) : (
          <h2 className="project-banner-title">{projectInfo.name}</h2>
        )}   
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className='dailylogform'>
          <table className='form-table'>
            <thead className='form-header'>
              <tr>
                <th>Asset Type</th>
                <th>Asset Name</th>
                <th>Process</th>
                <th>Status</th>
                {/* <th>Consumed<br></br>Man-days</th> */}
                <th>Actual<br></br>Man-days</th>
                <th>Description</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form, index) => (
                <tr key={index} className={form.collapsed ? 'form-row disabled' : 'form-row editable'} >
                  <td>
                    <select
                      value={form.assetType}
                      onChange={(e) => handleInputChange(index, 'assetType', e.target.value)}
                      className={getInputClassName(index, 'assetType')}
                      disabled={form.collapsed}
                    >
                      <option value="">Select...</option>
                      {assetTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={form.assetName}
                      onChange={(e) => handleInputChange(index, 'assetName', e.target.value)}
                      className={getInputClassName(index, 'assetName')}
                      disabled={form.collapsed || !form.assetType}
                    >
                      <option value="">Select...</option>
                      {form.assetType &&
                        assetNameOptions[form.assetType]?.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={form.process}
                      onChange={(e) => handleInputChange(index, 'process', e.target.value)}
                      className={getInputClassName(index, 'process')}
                      disabled={form.collapsed || !form.assetName}
                    >
                      <option value="">Select...</option>
                      {processOptions.map((process) => (
                        <option key={process.id} value={process.id}>
                          {process.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={form.status}
                      onChange={(e) => handleInputChange(index, 'status', e.target.value)}
                      className={getInputClassName(index, 'status')}
                      disabled={form.collapsed || !form.process}
                    >
                      <option value="">Select...</option>
                      {statusOptions.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* <td>
                    <input 
                      type="range" 
                      value={form.cManDays}
                      onChange={(e) => handleInputChange(index, 'cManDays', e.target.value)}
                      className="form-range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      disabled={form.collapsed || !form.status} 
                      />
                  </td> */}
                  <td>
                    <input
                      type="number"
                      value={form.manDays}
                      onChange={(e) => handleInputChange(index, 'manDays', e.target.value)}
                      className={getInputClassName(index, 'manDays')}
                      min="0"
                      step="any"
                      placeholder="Select..."
                      disabled={form.collapsed || !form.status}
                    />
                  </td>
                  <td>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                      className={getInputClassName(index, 'description')}
                      placeholder='Enter task details or comments...'
                      disabled={form.collapsed || !form.manDays}
                    />
                  </td>
                  <td>
                    <ImageUploadComponent 
                      index={index}
                      form={form}
                      handleImageChange={handleImageChange}
                      fileInputRefs={fileInputRefs}
                      imageName={form.imageName}
                    />
                  </td>
                  <td>
                    <div className='action-bar'>
                      {!form.collapsed ? (
                        <>
                          <button type="button" onClick={() => deleteForm(index)} className="delete-form-button">
                            <FontAwesomeIcon icon={faTrashAlt} />
                          </button>
                          <button type="button" onClick={() => clearForm(index)} className="delete-form-button">
                            <FontAwesomeIcon icon={faUndoAlt} />
                          </button>
                        </>
                      ) : (
                        <button 
                          type="button" 
                          onClick={() => toggleCollapse(index)} 
                          className={!form.prefilled ? "delete-form-button-collapsed" : "delete-form-button-disabled"}
                          disabled={form.prefilled}
                        >
                          <FontAwesomeIcon icon={faPencilAlt} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="form-actions">
          <button type="button" onClick={addForm} className="add-button" disabled={!isFormValid}>
            <FontAwesomeIcon icon={faPlus} /> Add Task
          </button>
          <button type="submit" className="submit-button" disabled={!isFormValid || forms.length === 0 || isAllPrefilled}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectDetail;
