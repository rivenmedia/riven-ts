import { FormBase } from "../form-base/form-base";

export interface UserManagementProps {}

export function UserManagement({}: UserManagementProps) {
  return (
    <FormBase
      title="User Management"
      description="Create local credential users and choose their access role."
      content={<></>}
    />
  );
}
