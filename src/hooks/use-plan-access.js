import {useAuth} from "@clerk/nextjs"

export function usePlanAccess () {
    const {has} = useAuth();

    const isPro = has?.({plan : "pro"}) || false;
    const isFree = !isPro; // If not pro, the free (default)

    // Define which tools are available for each palan
    const planAccess = {
        // Fee Plan tools
        resize : true,
        crop : true,
        adjust : true,
        text : true,

        // Pro-only Tools
        background : isPro,
        ai_extender : isPro,
        ai_edit : isPro
    }

    // Helper function to check if user has access t o as specific took
    const hasAccess = (toolId) =>{
        return planAccess[toolId] === true;
    }

    // Get restricted tools that user does'nt have access to
    const getRestrictedTools = () =>{
        return Object.entries(planAccess)
            .filter(([_, hasAccess]) => !hasAccess)
            .map(([toolId]) => toolId);
    }

    // Check if user has reached projects limits
    const canCreateProject = (currentProjectCount) => {
        if(isPro) return true;
        return currentProjectCount < 3 // Free limit
    }

    // check if user haa reached export limits
    const canExport = (currentExportsThisMonth) =>{
        if(isPro) return true;
        return  currentExportsThisMonth < 20;
    }


    return {
        usePlan : isPro ? "pro" : "free_user",
        isPro,
        isFree,
        hasAccess,
        planAccess,
        getRestrictedTools,
        canExport,
        canCreateProject
    }
}