import React from 'react';
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import "react-datepicker/dist/react-datepicker.css";
import "../css/toolbar.css"

const Toolbar = ({
  isRange,
  date,
  dateRange,
  handleRangeChange,
  handleDateChange,
  setDateRange,
  formatDate,
  formatDate_Range  
}) => {
  return (
        <div className='toolbar' style={{ zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ marginRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{ marginBottom: '10px' }}>Range</label>
                    <div style={{ position: 'relative', display: 'inline-block', width: 'auto' }}>
                        <input 
                            type="checkbox" 
                            className="btn-check" 
                            id="btn-check" 
                            autoComplete="off"
                            checked={isRange} 
                            onChange={handleRangeChange} 
                            style={{margin: '0'}}
                        />
                        <label className="btn btn-outline-dark btn-sm range" htmlFor="btn-check">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-calendar-week" viewBox="0 0 16 16">
                            <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/>
                            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                        </svg>
                        </label>
                    </div>
                </div>

                <div style={{ marginRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{ marginBottom: '10px' }}>Start Date</label>
                    <div style={{ position: 'relative', display: 'inline-block', width: '110px' }}>
                        <input
                            type="text"
                            value={isRange ? formatDate_Range(dateRange.start) : formatDate_Range(date)}
                            readOnly
                            style={{
                                width: '100%',
                                height: '30px',
                                padding: '5px 30px 5px 10px',
                                fontSize: '1em',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                        }}
                        />
                        <div 
                        style={{ 
                            position: 'absolute', 
                            right: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            cursor: 'pointer',
                            zIndex: 500 
                        }}
                        >
                        <DatePicker
                            selected={isRange ? dateRange.start : date}
                            onChange={(date) => isRange ? setDateRange({ ...dateRange, start: date }) : handleDateChange(date)}
                            maxDate={new Date()} 
                            customInput={<FontAwesomeIcon icon={faCalendarAlt} style={{fontSize: '13px'}}/>}
                            popperPlacement="bottom-end" 
                        />
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{ marginBottom: '10px' }} >End Date</label>
                    <div style={{ position: 'relative', display: 'inline-block', width: '110px' }}>
                        <input
                            type="text"
                            value={formatDate_Range(dateRange.end)}
                            readOnly
                            style={{
                                width: '100%',
                                height: '30px',
                                padding: '5px 30px 5px 10px',
                                fontSize: '1em',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                            }}
                            disabled={!isRange}
                        />
                        <div 
                            style={{ 
                                position: 'absolute', 
                                right: '10px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                cursor: isRange ? 'pointer' : 'not-allowed', 
                                zIndex: 500
                            }}
                            >
                            <DatePicker
                                selected={dateRange.end}
                                onChange={(date) => setDateRange({ ...dateRange, end: date })}
                                minDate={dateRange.start}
                                maxDate={new Date()}
                                selectsEnd
                                startDate={dateRange.start}
                                endDate={dateRange.end}
                                disabled={!isRange}
                                customInput={<FontAwesomeIcon icon={faCalendarAlt} />}
                                popperPlacement="bottom-end" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toolbar;

// import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
// import dayjs from 'dayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
// import { MobileDateRangePicker } from '@mui/x-date-pickers-pro/MobileDateRangePicker';
// import { useMediaQuery } from '@mui/material';
// import "react-datepicker/dist/react-datepicker.css";
// import "./toolbar.css";

// const Toolbar = ({
//   isRange,
//   date,
//   dateRange,
//   handleRangeChange,
//   setDateRange,
//   formatDate_Range  
// }) => {
//   const isMobile = useMediaQuery('(max-width:800px)'); // Adjust breakpoint for responsiveness

//   const DatePickerComponent = isMobile ? MobileDateRangePicker : DateRangePicker;

//   return (
//     <div className='toolbar' style={{ zIndex: 50 }}>
//       <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
//         <div style={{ marginRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//           <label style={{ marginBottom: '10px' }}>Range</label>
//           <input 
//             type="checkbox" 
//             className="btn-check" 
//             id="btn-check" 
//             autoComplete="off"
//             checked={isRange} 
//             onChange={handleRangeChange} 
//             style={{ margin: '0' }}
//           />
//         </div>

//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//           <div style={{ marginRight: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//             <DatePickerComponent
//               value={[dayjs(dateRange.start), dayjs(dateRange.end)]}
//               onChange={(newValue) => setDateRange({
//                 start: newValue[0]?.toDate() || null,
//                 end: newValue[1]?.toDate() || null,
//               })}
//               startText="Start"
//               endText="End"
//               customInput={<FontAwesomeIcon icon={faCalendarAlt} />}
//               maxDate={dayjs()}
//             //   disabled={!isRange}
//               renderInput={(startProps, endProps) => (
//                 <>
//                   <input
//                     {...startProps.inputProps}
//                     value={formatDate_Range(dateRange.start)}
//                     readOnly
//                     style={{
//                       width: '100%',
//                       height: '30px',
//                       padding: '5px 30px 5px 10px',
//                       fontSize: '1em',
//                       borderRadius: '4px',
//                       border: '1px solid #ccc',
//                     }}
//                   />
//                   <input
//                     {...endProps.inputProps}
//                     value={formatDate_Range(dateRange.end)}
//                     readOnly
//                     style={{
//                       width: '100%',
//                       height: '30px',
//                       padding: '5px 30px 5px 10px',
//                       fontSize: '1em',
//                       borderRadius: '4px',
//                       border: '1px solid #ccc',
//                     }}
//                     // disabled={!isRange}
//                   />
//                 </>
//               )}
//             />
//           </div>
//         </LocalizationProvider>
//       </div>
//     </div>
//   );
// };

// export default Toolbar;
