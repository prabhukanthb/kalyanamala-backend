import React, { useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'https://kalyanamala-backend-production.up.railway.app';

const initialForm = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  heightFeet: '',
  heightInches: '',
  religion: '',
  subCaste: '',
  siblingsCount: '',
  maritalStatus: '',
  haveChildren: 'No',
  familyStatus: '',
  familyValues: '',
  fatherName: '',
  fatherOccupation: '',
  motherName: '',
  motherOccupation: '',
  highestEducation: '',
  fieldOfStudy: '',
  college: '',
  occupation: '',
  employmentType: '',
  companyName: '',
  jobTitle: '',
  jobLocation: '',
  industry: '',
  income: '',
  incomeCurrency: 'INR',
  country: 'India',
  state: '',
  city: '',
  aboutMe: '',
  preferredMatch: 'any_religion'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  marginBottom: '14px',
  boxSizing: 'border-box'
};

const sectionStyle = {
  border: '1px solid #ddd',
  padding: '18px',
  marginBottom: '20px',
  borderRadius: '8px',
  background: '#fafafa'
};

const buttonStyle = {
  padding: '12px 20px',
  backgroundColor: '#2196F3',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

const readOnlyStyle = {
  ...inputStyle,
  backgroundColor: '#f1f1f1',
  cursor: 'not-allowed'
};

function calculateAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const Profile = () => {
  const { token, user } = useContext(AuthContext);

  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [profile,setProfile] = useState(null);
  const [form,setForm] = useState(initialForm);

  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/profiles/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const p = res.data.profile;
        setProfile(p);

        setForm({
          fullName: p.fullName || '',
          gender: p.gender || '',
          dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
          heightFeet: p.heightFeet || '',
          heightInches: p.heightInches || '',
          religion: p.religion || '',
          subCaste: p.subCaste || '',
          siblingsCount: p.siblingsCount?.toString() || '',
          maritalStatus: p.maritalStatus || '',
          haveChildren: p.haveChildren ? 'Yes' : 'No',
          familyStatus: p.familyStatus || '',
          familyValues: p.familyValues || '',
          fatherName: p.fatherName || '',
          fatherOccupation: p.fatherOccupation || '',
          motherName: p.motherName || '',
          motherOccupation: p.motherOccupation || '',
          highestEducation: p.highestEducation || '',
          fieldOfStudy: p.fieldOfStudy || '',
          college: p.college || '',
          occupation: p.occupation || '',
          employmentType: p.employmentType || '',
          companyName: p.companyName || '',
          jobTitle: p.jobTitle || '',
          jobLocation: p.jobLocation || '',
          industry: p.industry || '',
          income: p.income?.toString() || '',
          incomeCurrency: p.incomeCurrency || 'INR',
          country: p.currentAddress?.country || 'India',
          state: p.currentAddress?.state || '',
          city: p.currentAddress?.city || '',
          aboutMe: p.aboutMe || '',
          preferredMatch: p.preferredMatch || 'any_religion'
        });
      } catch (err) {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    } else {
      setLoading(false);
      setError('Please login again.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!age || age < 18) {
      setError('You must be at least 18 years old.');
      return;
    }

    if (!form.heightFeet || !form.heightInches) {
      setError('Please select height in feet and inches.');
      return;
    }

    const payload = {
      fullName: form.fullName,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      heightFeet: form.heightFeet,
      heightInches: form.heightInches,
      heightCm: null,
      caste: 'Mala',
      subCaste: form.subCaste,
      religion: form.religion,
      maritalStatus: form.maritalStatus,
      haveChildren: form.haveChildren === 'Yes',
      siblingsCount: Number(form.siblingsCount || 0),
      familyStatus: form.familyStatus,
      familyValues: form.familyValues,
      fatherName: form.fatherName,
      fatherOccupation: form.fatherOccupation,
      motherName: form.motherName,
      motherOccupation: form.motherOccupation,
      highestEducation: form.highestEducation,
      fieldOfStudy: form.fieldOfStudy,
      college: form.college,
      occupation: form.occupation,
      employmentType: form.employmentType,
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      jobLocation: form.jobLocation,
      industry: form.industry,
      income: Number(form.income),
      incomeCurrency: form.incomeCurrency,
      currentAddress: {
        location: `${form.city}, ${form.state}, ${form.country}`,
        city: form.city,
        state: form.state,
        country: form.country
      },
      aboutMe: form.aboutMe,
      preferredMatch: form.preferredMatch
    };

    setSaving(true);

    try {
      let res;

      if (profile) {
        res = await axios.put(`${API_BASE}/api/profiles/me`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        res = await axios.post(`${API_BASE}/api/profiles`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      setProfile(res.data.profile);
      alert(profile ? 'Profile updated successfully' : 'Profile created successfully');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '950px', margin: '40px auto', padding: '20px' }}>
      <h2>My Profile</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffebee', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      <div style={sectionStyle}>
        <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> {user?.phone}</p>
        <p><strong>Status:</strong> {profile ? profile.approvalStatus || 'Pending' : 'No profile yet'}</p>
        <p><strong>Age:</strong> {age || '-'}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={sectionStyle}>
          <h3>Basic Details</h3>

          <label>Full Name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} style={inputStyle} required />

          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle} required>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label>DOB</label>
          <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} required />

          <label>Height</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select name="heightFeet" value={form.heightFeet} onChange={handleChange} style={inputStyle} required>
              <option value="">Feet</option>
              {[4,5,6,7].map((n) => (
                <option key={n} value={n}>{n} ft</option>
              ))}
            </select>

            <select name="heightInches" value={form.heightInches} onChange={handleChange} style={inputStyle} required>
              <option value="">Inches</option>
              {[0,1,2,3,4,5,6,7,8,9,10,11].map((n) => (
                <option key={n} value={n}>{n} in</option>
              ))}
            </select>
          </div>
        </div>

        <div style={sectionStyle}>
          <h3>Religion & Family</h3>

          <label>Religion</label>
          <select name="religion" value={form.religion} onChange={handleChange} style={inputStyle} required>
            <option value="">Select</option>
            <option value="Christian">Christian</option>
            <option value="Hindu">Hindu</option>
            <option value="Ambedkarist">Ambedkarist</option>
            <option value="Buddhist">Buddhist</option>
            <option value="Other">Other</option>
          </select>

          <label>Caste</label>
          <input value="Mala" readOnly style={readOnlyStyle} />

          <label>Sub Caste</label>
          <select name="subCaste" value={form.subCaste} onChange={handleChange} style={inputStyle} required>
            <option value="">Select</option>
            <option value="SC">SC</option>
            <option value="BC">BC</option>
            <option value="OC">OC</option>
            <option value="NA">NA</option>
          </select>

          <label>No. of siblings</label>
          <input type="number" name="siblingsCount" value={form.siblingsCount} onChange={handleChange} style={inputStyle} required />

          <label>Marital status</label>
          <select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} style={inputStyle} required>
            <option value="">Select</option>
            <option value="Never married">Never married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="Awaiting Divorce">Awaiting Divorce</option>
          </select>

          <label>Have Children</label>
          <select name="haveChildren" value={form.haveChildren} onChange={handleChange} style={inputStyle}>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>

          <label>Family Status</label>
          <input name="familyStatus" value={form.familyStatus} onChange={handleChange} style={inputStyle} />

          <label>Family Values</label>
          <input name="familyValues" value={form.familyValues} onChange={handleChange} style={inputStyle} />

          <label>Father’s Name</label>
          <input name="fatherName" value={form.fatherName} onChange={handleChange} style={inputStyle} required />

          <label>Father Occupation</label>
          <input name="fatherOccupation" value={form.fatherOccupation} onChange={handleChange} style={inputStyle} required />

          <label>Mother’s Name</label>
          <input name="motherName" value={form.motherName} onChange={handleChange} style={inputStyle} required />

          <label>Mother Occupation</label>
          <input name="motherOccupation" value={form.motherOccupation} onChange={handleChange} style={inputStyle} required />
        </div>

        <div style={sectionStyle}>
          <h3>Professional & Education</h3>

          <label>Highest Education</label>
          <input name="highestEducation" value={form.highestEducation} onChange={handleChange} style={inputStyle} required />

          <label>Field of study / Specialization</label>
          <input name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} style={inputStyle} required />

          <label>College</label>
          <input name="college" value={form.college} onChange={handleChange} style={inputStyle} required />

          <label>Occupation</label>
          <input name="occupation" value={form.occupation} onChange={handleChange} style={inputStyle} required />

          <label>Employment type</label>
          <select name="employmentType" value={form.employmentType} onChange={handleChange} style={inputStyle} required>
            <option value="">Select</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="govt">Govt</option>
            <option value="business">Business</option>
            <option value="self-employed">Self Employed</option>
            <option value="other">Other</option>
          </select>

          <label>Company Name</label>
          <input name="companyName" value={form.companyName} onChange={handleChange} style={inputStyle} required />

          <label>Job title</label>
          <input name="jobTitle" value={form.jobTitle} onChange={handleChange} style={inputStyle} required />

          <label>Job Location</label>
          <input name="jobLocation" value={form.jobLocation} onChange={handleChange} style={inputStyle} required />

          <label>Industry</label>
          <input name="industry" value={form.industry} onChange={handleChange} style={inputStyle} required />

          <label>Income</label>
          <input type="number" name="income" value={form.income} onChange={handleChange} style={inputStyle} required />

          <label>Income Currency</label>
          <input value="INR" readOnly style={readOnlyStyle} />
        </div>

        <div style={sectionStyle}>
          <h3>Current Address</h3>

          <label>Country</label>
          <input name="country" value={form.country} onChange={handleChange} style={inputStyle} required />

          <label>State</label>
          <input name="state" value={form.state} onChange={handleChange} style={inputStyle} required />

          <label>City</label>
          <input name="city" value={form.city} onChange={handleChange} style={inputStyle} required />
        </div>

        <div style={sectionStyle}>
          <h3>About & Preference</h3>

          <label>About Me</label>
          <textarea
            name="aboutMe"
            value={form.aboutMe}
            onChange={handleChange}
            rows="5"
            style={inputStyle}
            required
          />

          <label>Preferred Match</label>
          <select name="preferredMatch" value={form.preferredMatch} onChange={handleChange} style={inputStyle}>
            <option value="same_religion">Same Religion</option>
            <option value="any_religion">Any Religion</option>
            <option value="open">Open</option>
          </select>
        </div>

        <button type="submit" disabled={saving} style={buttonStyle}>
          {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
