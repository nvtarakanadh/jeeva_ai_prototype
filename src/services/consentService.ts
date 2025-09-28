import { supabase } from '@/integrations/supabase/client';
import { ConsentRequest, ConsentStatus, RecordType } from '@/types';

export interface ConsentRequestData {
  patientId: string;
  doctorId: string;
  purpose: string;
  requestedDataTypes: RecordType[];
  duration: number;
  message?: string;
}

export interface ConsentResponseData {
  status: 'approved' | 'denied';
  dataTypes?: RecordType[];
}

// Helper function to get doctor name
const getDoctorName = async (doctorId: string): Promise<string> => {
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('user_id', doctorId)
    .single();
  
  return doctorProfile?.full_name || 'Unknown Doctor';
};

// Get consent requests for a doctor
export const getDoctorConsentRequests = async (doctorId: string): Promise<ConsentRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    // Get doctor names for all requests
    const doctorIds = [...new Set(data.map(r => r.doctor_id))];
    const { data: doctorProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', doctorIds);

    const doctorMap = new Map(doctorProfiles?.map(p => [p.user_id, p.full_name]) || []);

    return data.map(request => ({
      id: request.id,
      patientId: request.patient_id,
      requesterId: request.doctor_id,
      requesterName: doctorMap.get(request.doctor_id) || 'Unknown Doctor',
      purpose: request.purpose,
      requestedDataTypes: request.requested_data_types as RecordType[],
      duration: request.duration_days,
      status: request.status as ConsentStatus,
      requestedAt: new Date(request.requested_at),
      respondedAt: request.responded_at ? new Date(request.responded_at) : undefined,
      expiresAt: request.expires_at ? new Date(request.expires_at) : undefined,
      message: request.message
    }));
  } catch (error) {
    console.error('Error fetching doctor consent requests:', error);
    throw error;
  }
};

// Get consent requests for a patient
export const getPatientConsentRequests = async (patientId: string): Promise<ConsentRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('consent_requests')
      .select('*')
      .eq('patient_id', patientId)
      .order('requested_at', { ascending: false });

    if (error) throw error;

    // Get doctor names for all requests
    const doctorIds = [...new Set(data.map(r => r.doctor_id))];
    const { data: doctorProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', doctorIds);

    const doctorMap = new Map(doctorProfiles?.map(p => [p.user_id, p.full_name]) || []);

    return data.map(request => ({
      id: request.id,
      patientId: request.patient_id,
      requesterId: request.doctor_id,
      requesterName: doctorMap.get(request.doctor_id) || 'Unknown Doctor',
      purpose: request.purpose,
      requestedDataTypes: request.requested_data_types as RecordType[],
      duration: request.duration_days,
      status: request.status as ConsentStatus,
      requestedAt: new Date(request.requested_at),
      respondedAt: request.responded_at ? new Date(request.responded_at) : undefined,
      expiresAt: request.expires_at ? new Date(request.expires_at) : undefined,
      message: request.message
    }));
  } catch (error) {
    console.error('Error fetching patient consent requests:', error);
    throw error;
  }
};

// Create a new consent request
export const createConsentRequest = async (requestData: ConsentRequestData): Promise<ConsentRequest> => {
  try {
    console.log('Creating consent request with data:', requestData);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated:', user.id);
    
    // Insert consent request with all required fields
    const insertData = {
      patient_id: requestData.patientId,
      doctor_id: requestData.doctorId,
      purpose: requestData.purpose,
      requested_data_types: requestData.requestedDataTypes,
      duration_days: requestData.duration,
      status: 'pending',
      message: requestData.message
    };
    
    console.log('Inserting data:', insertData);
    
    const { data, error } = await supabase
      .from('consent_requests')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Successfully created consent:', data);

    // Get doctor name from profiles table
    const doctorName = await getDoctorName(data.doctor_id);

    return {
      id: data.id,
      patientId: data.patient_id,
      requesterId: data.doctor_id,
      requesterName: doctorName,
      purpose: data.purpose,
      requestedDataTypes: data.requested_data_types as RecordType[],
      duration: data.duration_days,
      status: data.status as ConsentStatus,
      requestedAt: new Date(data.requested_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      message: data.message
    };
  } catch (error) {
    console.error('Error creating consent request:', error);
    throw error;
  }
};

// Respond to a consent request
export const respondToConsentRequest = async (
  requestId: string, 
  response: ConsentResponseData
): Promise<ConsentRequest> => {
  try {
    const updateData: any = {
      status: response.status === 'approved' ? 'approved' : 'denied',
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (response.status === 'approved') {
      // Set expiration date based on duration (default 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      updateData.expires_at = expiresAt.toISOString();
    }

    const { data, error } = await supabase
      .from('consent_requests')
      .update(updateData)
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) throw error;

    const doctorName = await getDoctorName(data.doctor_id);

    return {
      id: data.id,
      patientId: data.patient_id,
      requesterId: data.doctor_id,
      requesterName: doctorName,
      purpose: data.purpose,
      requestedDataTypes: data.requested_data_types as RecordType[],
      duration: data.duration_days,
      status: data.status as ConsentStatus,
      requestedAt: new Date(data.requested_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      message: data.message
    };
  } catch (error) {
    console.error('Error responding to consent request:', error);
    throw error;
  }
};

// Revoke a consent request
export const revokeConsentRequest = async (requestId: string): Promise<ConsentRequest> => {
  try {
    const { data, error } = await supabase
      .from('consent_requests')
      .update({
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) throw error;

    const doctorName = await getDoctorName(data.doctor_id);

    return {
      id: data.id,
      patientId: data.patient_id,
      requesterId: data.doctor_id,
      requesterName: doctorName,
      purpose: data.purpose,
      requestedDataTypes: data.requested_data_types as RecordType[],
      duration: data.duration_days,
      status: data.status as ConsentStatus,
      requestedAt: new Date(data.requested_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      message: data.message
    };
  } catch (error) {
    console.error('Error revoking consent request:', error);
    throw error;
  }
};

// Extend consent request expiration
export const extendConsentRequest = async (requestId: string, additionalDays: number = 30): Promise<ConsentRequest> => {
  try {
    const { data: currentData, error: fetchError } = await supabase
      .from('consent_requests')
      .select('expires_at')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    const currentExpiry = currentData.expires_at ? new Date(currentData.expires_at) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + additionalDays * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('consent_requests')
      .update({
        expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (error) throw error;

    const doctorName = await getDoctorName(data.doctor_id);

    return {
      id: data.id,
      patientId: data.patient_id,
      requesterId: data.doctor_id,
      requesterName: doctorName,
      purpose: data.purpose,
      requestedDataTypes: data.requested_data_types as RecordType[],
      duration: data.duration_days,
      status: data.status as ConsentStatus,
      requestedAt: new Date(data.requested_at),
      respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      message: data.message
    };
  } catch (error) {
    console.error('Error extending consent request:', error);
    throw error;
  }
};

// Get patients for a doctor (for creating consent requests)
export const getPatientsForDoctor = async (doctorId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role')
      .eq('role', 'patient')
      .order('full_name');

    if (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }

    const patients = data.map(patient => ({
      id: patient.user_id,
      name: patient.full_name,
      email: patient.email
    }));

    return patients;
  } catch (error) {
    console.error('Error fetching patients for doctor:', error);
    throw error;
  }
};
