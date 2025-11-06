import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {internal} from "./_generated/api";

// Get  all project for the current usr 
export const getUserProjects = query({
    handler : async( ctx ) => {
        const user = await ctx.runQuery(internal.user.getCurrentUser);
        // Get the curret user  projects ordered by tmust recently updated
        const projects = await ctx.db.query("projects")
        .withIndex("by_user_updated", (q) => q.eq("userId" , user._id))
        .order("desc")
        .collect();

        return projects;
    }
})

// Crete a new Project 

export const create = mutation({
    args : {
        title: v.string(),
        originalImageUrl: v.optional(v.string()),
        currentImageUrl: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        width: v.number(),
        height: v.number(),
        canvasState: v.optional(v.any()),
    },
    handler  : async (ctx, args) => {
        const user = await ctx.runQuery(internal.user.getCurrentUser);

        // Check plan limits for free users
        if(user.plan === "free") {
            const projectCount = await ctx.db.query("projects")
            .withIndex("by_user" , (q) => q.eq ("userId" , user._id))
            .collect();

            if(projectCount.length >= 3) {
                throw new Error("Free plan limited to 3 projects , upgrader to pro for unlimited projects");
            }
        }

        // Create the projects
        const projectId = await ctx.db.insert("projects" , {
            title: args.title,
            userId: user._id,
            originalImageUrl: args.originalImageUrl,
            currentImageUrl: args.currentImageUrl,
            thumbnailUrl: args.thumbnailUrl,
            width: args.width,
            height: args.height,
            canvasState: args.canvasState,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        })

        // Upgrade users projects count
        await ctx.db.patch(user._id , {
            projectsUsed: user.projectsUsed + 1,
            lastActiveAt: Date.now(),
        })

        return projectId;
    }
})


//Delete the project

export const deleteProject = mutation({
    args : {
        projectId : v.id("projects")
    },
    handler : async(ctx, args) => {
        const user  = await ctx.runQuery(internal.user.getCurrentUser);
        const project  = await ctx.db.get(args.projectId);

        if(!project) {
            throw new Error("Project Not Found")
        }
        
        if(!user || project.userId !== user._id) {
            throw new Error ("Access Denied");
        }

        // Delet the project 
        await ctx.db.delete(args.projectId);

        // Updatae  users project count
        await ctx.db.patch(user._id, {
            projectsUsed : Math.max(0,user.projectUsed -1),
            lastActiveAt : Date.now(),
        });


        return {success : true};
      }
})



// Get a signle project by id

export const getProject = query({
    args : {projectId : v.id("projects")},
    handler : async(ctx,args ) => {
        const user = await ctx.runQuery(internal.user.getCurrentUser);
        const project = await ctx.db.get(args.projectId);
        if(!project){
            throw new Error("Projects not found")
        }
        if(!user || project.userId !== user._id) {
            throw new Error("Access Denied");
        }

        return project;
    }
})


// Update project canvas state and metadata
export const updateProject = mutation({
    args: {
      projectId: v.id("projects"),
      canvasState: v.optional(v.any()),
      width: v.optional(v.number()), // ← Add this
      height: v.optional(v.number()), // ← Add this
      currentImageUrl: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      activeTransformations: v.optional(v.string()),
      backgroundRemoved: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
      const user = await ctx.runQuery(internal.user.getCurrentUser);
  
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Project not found");
      }
  
      if (!user || project.userId !== user._id) {
        throw new Error("Access denied");
      }
  
      // Update the project
      const updateData = {
        updatedAt: Date.now(),
      };
  
      // Only update provided fields
      if (args.canvasState !== undefined)
        updateData.canvasState = args.canvasState;
      if (args.width !== undefined) updateData.width = args.width;
      if (args.height !== undefined) updateData.height = args.height;
      if (args.currentImageUrl !== undefined)
        updateData.currentImageUrl = args.currentImageUrl;
      if (args.thumbnailUrl !== undefined)
        updateData.thumbnailUrl = args.thumbnailUrl;
      if (args.activeTransformations !== undefined)
        updateData.activeTransformations = args.activeTransformations;
      if (args.backgroundRemoved !== undefined)
        updateData.backgroundRemoved = args.backgroundRemoved;
  
      await ctx.db.patch(args.projectId, updateData);
  
      // Update user's last active time
      await ctx.db.patch(user._id, {
        lastActiveAt: Date.now(),
      });
  
      return args.projectId;
    },
  });