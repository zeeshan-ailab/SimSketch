export type SimulationType = 'optics' | 'electricity' | 'none';

export type OpticalElement = 
  | 'convex_lens' 
  | 'concave_lens' 
  | 'concave_mirror' 
  | 'convex_mirror' 
  | 'plane_mirror';

export interface OpticsParams {
  element_type: OpticalElement;
  focal_length: number;    
  object_distance: number; 
  object_height: number;   
}

export interface ElectricityParams {
  voltage: number;         
  resistance: number;      
  polarity_reversed: boolean;
  has_diode?: boolean;
  has_motor?: boolean;
  has_switch?: boolean;
  switch_closed?: boolean;
}

export interface SimulationResult {
  simulation_type: SimulationType;
  title: string;
  explanation: string;
  optics?: OpticsParams;
  electricity?: ElectricityParams;
  debug_prompt?: string;
  debug_response?: string;
}
