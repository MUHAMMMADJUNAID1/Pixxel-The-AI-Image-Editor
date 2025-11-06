import {mutation, query} from  "./_generated/server";


export const store = mutation({
    args : {},
    handler : async (ctx)  => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new Error("Called store without authentication present")
        }

        // Check if we are already stored tis identity before
        const user = await ctx.db.query("users")
        .withIndex("by_token" , (q) => q.eq("tokenIdentifier" , identity.tokenIdentifier))
        .unique();

        if(user !== null){
            // IF we have seen this identity before but the name has changed pathed the value
            if(user.name !== identity.name){
                await ctx.db.patch(user._id , {name : identity.name})
            }
            return user._id;
        }
        
        // If the user  a new identity create a new User
        return await ctx.db.insert("users" , {
            name: identity.name ?? "Anonymous",
            tokenIdentifier: identity.tokenIdentifier,
            email: identity.email,
            imageUrl: identity.pictureUrl,
            plan: "free", // Default plan
            projectsUsed: 0, // Initialize usage counters
            exportsThisMonth: 0,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        });
    
    }
})  
export const getCurrentUser = query({
    handler : async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) {
            throw new Error ("Not authenticatd")
        }
        const user = await ctx.db.query("users")
        .withIndex("by_token" , (q) => q.eq("tokenIdentifier" , identity.tokenIdentifier))
        .unique()

        if(!user) {
            throw new Error(" User not found")
        }
        return user;
    }
})