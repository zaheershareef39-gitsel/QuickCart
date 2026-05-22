// src/inngest/client.ts
import { Inngest } from "inngest";
import connectDB from "./db";
import User from "../models/user";

export const inngest = new Inngest({
    id: "quickcart-next",
    signingKey: process.env.INNGEST_SIGNING_KEY,
    eventKey: process.env.INNGEST_EVENT_KEY,
});

// innfest function to save user data to a database

export const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: { event: "clerk.user.created" },
    },
    async ({ event }) => {
        try {
            const { id, first_name, last_name, email_addresses, image_url } = event.data;

            if (!email_addresses || email_addresses.length === 0) {
                throw new Error("No email address provided");
            }

            const userData = {
                _id: id,
                email: email_addresses[0].email_address,
                name: `${first_name || ''} ${last_name || ''}`.trim(),
                imageUrl: image_url || '',
            };

            console.log("[Inngest] Syncing user:", userData);
            await connectDB();
            await User.create(userData);
            console.log("[Inngest] User created successfully:", id);
        } catch (error) {
            console.error("[Inngest Error] Failed to sync user:", error.message);
            throw error;
        }
    }
)

//Inngest function to sync user data on update
export const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: { event: "clerk/user.updated" },
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl: image_url,
        }
        await connectDB()
        await User.findByIdAndUpdate(id, userData)
    }
)

//Inngest function to delete user data on deletion
export const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-with-clerk",
        triggers: { event: "clerk/user.deleted" },
    },
    async ({ event }) => {
        const { id } = event.data
        await connectDB()
        await User.findByIdAndDelete(id)
    }
)