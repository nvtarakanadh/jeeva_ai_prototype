import { supabase } from '@/integrations/supabase/client';

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescription_date: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface ConsultationNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  diagnosis: string;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  consultation_date: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const createPrescription = async (prescriptionData: {
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  prescription_date: string;
  file_url?: string;
  file_name?: string;
}): Promise<Prescription> => {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([prescriptionData])
      .select(`
        *,
        profiles!prescriptions_doctor_id_fkey (
          full_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return {
      ...data,
      profiles: {
        full_name: data.profiles?.full_name || 'Unknown',
        email: data.profiles?.email || ''
      }
    };
  } catch (error) {
    throw error;
  }
};

export const uploadPrescriptionFile = async (file: File, prescriptionId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prescriptionId}.${fileExt}`;
    const filePath = `prescriptions/${fileName}`;

    const { data, error } = await supabase.storage
      .from('prescriptions')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    throw error;
  }
};

export const createConsultationNote = async (noteData: {
  patient_id: string;
  doctor_id: string;
  title: string;
  description: string;
  diagnosis: string;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  consultation_date: string;
  file_url?: string;
  file_name?: string;
}): Promise<ConsultationNote> => {
  try {
    const { data, error } = await supabase
      .from('consultation_notes')
      .insert([noteData])
      .select(`
        *,
        profiles!consultation_notes_doctor_id_fkey (
          full_name,
          email
        )
      `)
      .single();

    if (error) throw error;
    return {
      ...data,
      profiles: {
        full_name: data.profiles?.full_name || 'Unknown',
        email: data.profiles?.email || ''
      }
    };
  } catch (error) {
    throw error;
  }
};

export const uploadConsultationNoteFile = async (file: File, noteId: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${noteId}.${fileExt}`;
    const filePath = `consultation-notes/${fileName}`;

    const { data, error } = await supabase.storage
      .from('consultation-notes')
      .upload(filePath, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('consultation-notes')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    throw error;
  }
};

export const getPrescriptionsForPatient = async (patientId: string): Promise<Prescription[]> => {
  try {
    
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        profiles!prescriptions_doctor_id_fkey (
          full_name,
          email
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('Could not find the table') || error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};

export const getConsultationNotesForPatient = async (patientId: string): Promise<ConsultationNote[]> => {
  try {
    const { data, error } = await supabase
      .from('consultation_notes')
      .select(`
        *,
        profiles!consultation_notes_doctor_id_fkey (
          full_name,
          email
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('Could not find the table') || error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};

export const getPrescriptionsByDoctor = async (doctorId: string): Promise<Prescription[]> => {
  try {
    // First check if doctor has access to view prescriptions
    const { data: access, error: accessError } = await supabase
      .from('patient_access')
      .select('patient_id')
      .eq('doctor_id', doctorId)
      .eq('status', 'active')
      .or('access_type.eq.view_prescriptions,access_type.eq.all');

    if (accessError) throw accessError;

    if (!access || access.length === 0) {
      return [];
    }

    const patientIds = access.map(acc => acc.patient_id);

    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        profiles!prescriptions_patient_id_fkey (
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};

export const getConsultationNotesByDoctor = async (doctorId: string): Promise<ConsultationNote[]> => {
  try {
    // First check if doctor has access to view consultation notes
    const { data: access, error: accessError } = await supabase
      .from('patient_access')
      .select('patient_id')
      .eq('doctor_id', doctorId)
      .eq('status', 'active')
      .or('access_type.eq.view_consultation_notes,access_type.eq.all');

    if (accessError) throw accessError;

    if (!access || access.length === 0) {
      return [];
    }

    const patientIds = access.map(acc => acc.patient_id);

    const { data, error } = await supabase
      .from('consultation_notes')
      .select(`
        *,
        profiles!consultation_notes_patient_id_fkey (
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};

// Get all prescriptions for a doctor (with access control)
export const getPrescriptionsForDoctor = async (doctorId: string): Promise<Prescription[]> => {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        profiles!prescriptions_patient_id_fkey (
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('Could not find the table') || error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};

// Get all consultation notes for a doctor (with access control)
export const getConsultationNotesForDoctor = async (doctorId: string): Promise<ConsultationNote[]> => {
  try {
    const { data, error } = await supabase
      .from('consultation_notes')
      .select(`
        *,
        profiles!consultation_notes_patient_id_fkey (
          full_name,
          email
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.message.includes('Could not find the table') || error.message.includes('relation') || error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
    return (data || []).map(item => ({
      ...item,
      profiles: {
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || ''
      }
    }));
  } catch (error) {
    throw error;
  }
};
