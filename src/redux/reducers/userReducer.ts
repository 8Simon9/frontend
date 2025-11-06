// reducers/exampleReducer.ts
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState: InitialState = {
  isAuth: false,
  loading: false,
  error: "",
  user: {
    access: "",
    email: "",
    id: "",
    full_name: "",
    date_joined: "",
    balance: 0.0,
    equity: 0.0,
    margin: 0.0,
    free_margin: 0.0,
    open_p_and_l: 0.0,
    close_p_and_l: 0.0,
    credit: 0.0,
  },
};

export const fetchProfileDetails = createAsyncThunk(
  "user/fetch-profile",
  async (_, { rejectWithValue }) => {
    console.log("fetchProfileDetails: Starting...");
    try {
      const response = await axios.get(`/api/user/profile`);
      console.log("fetchProfileDetails: Response status:", response.status);

      if (response.status === 200) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch profile");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("There was an error: ", error);
        return rejectWithValue(error.response?.data || "Something went wrong");
      } else {
        console.log("There was an unexpected error: ", error);
        return rejectWithValue({ error: "Unknown error" });
      }
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<boolean>) => {
      state.isAuth = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setBalance: (state, action: PayloadAction<number>) => {
      state.user = { ...state.user, balance: action.payload };
    },
    setCredit: (state, action: PayloadAction<number>) => {
      state.user = { ...state.user, credit: action.payload };
    },

    logout: (state) => {
      state.isAuth = false;
      state.user = {
        access: "",
        email: "",
        id: "",
        full_name: "",
        date_joined: "",
        balance: 0.0,
        equity: 0.0,
        margin: 0.0,
        free_margin: 0.0,
        open_p_and_l: 0.0,
        close_p_and_l: 0.0,
        credit: 0.0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileDetails.pending, (state) => {
        state.loading = true;
        // state.error = null;
      })
      .addCase(fetchProfileDetails.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        state.loading = false;
      })
      .addCase(fetchProfileDetails.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const {
  setAuth,
  setUser,
  setBalance,
  setCredit,
  logout,
} = userSlice.actions;
export default userSlice.reducer;
