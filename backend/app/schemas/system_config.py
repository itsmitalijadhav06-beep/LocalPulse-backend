from pydantic import BaseModel, ConfigDict

class SystemConfigUpdate(BaseModel):
    maintenance_mode: bool
    allow_registration: bool
    issue_auto_assignment: bool
    max_upload_size_mb: int
    default_search_radius_km: int
    notifications_enabled: bool
    provider_auto_approval: bool
    event_creation_enabled: bool

class SystemConfigResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )
    
    maintenance_mode: bool
    allow_registration: bool
    issue_auto_assignment: bool
    max_upload_size_mb: int
    default_search_radius_km: int
    notifications_enabled: bool
    provider_auto_approval: bool
    event_creation_enabled: bool
