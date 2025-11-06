// Convex ka schema 
import {defineSchema, defineTable} from "convex/server";
import {v} from "convex/values";

export default defineSchema(
    {
        // User table - scyced with clerk authentication
        users : defineTable({
            // basic user info from clerk
            name : v.string(),
            email : v.string(),
            tokenIdentifier : v.string(), //  Clerk User Id for auth
            imageUrl : v.optional(v.string()),// profile picture

            // Subscription plan (Manged buy Clerk Billing)
            plan: v.union(v.literal("free"), v.literal("pro")),

            // Usage tracking for plan limits
            projectsUsed : v.number() , // Current project count
            exportsThisMonth : v.number(), // Monthly export limit tracking

              // Activity timestamps
            createdAt: v.number(),
            lastActiveAt: v.number(),
        })
        .index("by_token", ["tokenIdentifier"]) // Primary auth lookup
        .index("by_email", ["email"]) // Email lookups
        .searchIndex("search_name", { searchField: "name" }) // User search
        .searchIndex("search_email", { searchField: "email" }),

        // Main Projects table -strores edtting sessions
        projects : defineTable({
        // Basic project info
        title: v.string(),
        userId: v.id("users"), // Owner reference
        
        // Canvas dimensions and state
        canvasState : v.any(), // fabric js Canvas Json(objects, json, layers etc)
        width : v.number(),
        height : v.number(),

        // Image pipeline -- track images transformation
        originalImageUrl: v.optional(v.string()), // Initial uploaded image
        currentImageUrl: v.optional(v.string()), // Current processed image
        thumbnailUrl: v.optional(v.string()), // HW - Small preview for dashboard

         // ImageKit transformation state
         activeTransformations: v.optional(v.string()), // Current ImageKit URL params

         // AI features state - tracks what AI processing has been applied
         backgroundRemoved: v.optional(v.boolean()), // Has background been removed
 
         // Organization
         folderId: v.optional(v.id("folders")), // HW - Optional folder organization
 
         // Timestamps
         createdAt: v.number(),
         updatedAt: v.number(), // Last edit time
 
        })
        .index("by_user", ["userId"]) // Get user's projects
        .index("by_user_updated", ["userId", "updatedAt"]) // Recent projects
        .index("by_folder", ["folderId"]), // Projects in folder

        // Simple folder organization
    folders: defineTable({
        name: v.string(), // Folder name
        userId: v.id("users"), // Owner
        createdAt: v.number(),
    }).index("by_user", ["userId"]), // User's folders
    }
)