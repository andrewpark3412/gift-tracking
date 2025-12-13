export type ListVisibility = "private" | "household";

export type Household = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
};

export type List = {
  id: string;
  household_id: string;
  owner_user_id: string;
  name: string;
  year: number;
  visibility: ListVisibility;
    created_at: string;
  updated_at: string;
};

export type Person = {
  id: string;
  list_id: string;
  name: string;
  budget: number | null; // null = no budget
  is_manually_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type GiftStatus = "idea" | "purchased";

export type Gift = {
  id: string;
  person_id: string;
  description: string;
  price: number;
  status: GiftStatus;
  is_wrapped: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseholdInvite = {
  id: string;
  household_id: string;
  invited_email: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
};
