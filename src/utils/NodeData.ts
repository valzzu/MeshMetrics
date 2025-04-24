// types/NodeData.ts
export interface Telemetry {
  air_util_tx?: number;
  battery_level?: number;
  channel_utilization?: number;
  uptime_seconds?: number;
  voltage?: number;
  barometric_pressure?: number;
  current?: number;
  gas_resistance?: number;
  iaq?: number;
  lux?: number;
  relative_humidity?: number;
  temperature?: number;
  white_lux?: number;
  wind_direction?: number;
  wind_speed?: number;
  current_ch1?: number;
  current_ch2?: number;
  current_ch3?: number;
  voltage_ch1?: number;
  voltage_ch2?: number;
  voltage_ch3?: number;
}

export interface NodeData {
  id: string;
  shortName: string;
  longName: string;
  telemetry: Telemetry;
  from?: number;
  hardware_model?: string;
  role?: string;
  hop_start?: number;
  hops_away?: number;
  timestamp?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  position_updated_at?: number;
  neighbours_updated_at?: number;
  neighbour_broadcast_interval_secs?: number;
  neighbours?: any[]; // You can define a more specific type if needed
  mqtt_connection_state?: string;
  mqtt_updated_at?: number;
  firmware_version?: string;
  region?: string;
  modem_preset?: string;
  has_default_channel?: boolean;
  position_precision?: number;
  num_online_local_nodes?: number;
}
