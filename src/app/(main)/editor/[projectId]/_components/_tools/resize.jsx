'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Expand, Lock, Unlock, Monitor } from "lucide-react";
import { useCanvas } from "@/context/context";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { api } from "../../../../../../../convex/_generated/api";
import { Label } from "@/components/ui/label";

// Common aspect Ratio
const ASPECT_RATIOS = [
    { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
    { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
    { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
    { name: "Portrait", ratio: [2, 3], label: "2:3" },
    { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
    { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
];

export function ResizeControls({ project }) {
    const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
    const [newWidth, setNewWidth] = useState(project?.width || 800);
    const [newHeight, setNewHeight] = useState(project?.height || 600);
    const [lockAspectRatio, setLockAspectRatio] = useState(true);
    const [selectedPreset, setSelectedPreset] = useState(null);

    const {
        mutate: updateProject, // FIXED: was "updatedProject"
        data,
        isLoading
    } = useConvexMutation(api.projects.updateProject);

    useEffect(() => {
        if (!isLoading && data) {
            window.location.reload();
        }
    }, [data, isLoading]);

    // FIXED: Early return was in wrong place - moved to top of component
    if (!canvasEditor || !project) {
        return (
            <div className='p-4'>
                <p className="text-white/70 text-sm">
                    Canvas Not Ready
                </p>
            </div>
        );
    }

    // Calculate dimensions for aspect ratio based on original canvas size
    const calculateAspectRatioDimensions = (ratio) => { // FIXED: typo "Dimentions"
        if (!project) return { width: project.width, height: project.height };

        const [ratioW, ratioH] = ratio;
        const originalArea = project.width * project.height;

        // Calculate new Dimensions maintaining the same area approximately
        const aspectRatio = ratioW / ratioH;
        const newHeight = Math.sqrt(originalArea / aspectRatio);
        const newWidth = newHeight * aspectRatio;

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
        };
    };

    // Handle width change with aspect ratio lock
    const handleWidthChange = (value) => {
        const width = parseInt(value) || 0;
        setNewWidth(width);

        if (lockAspectRatio && project) {
            const ratio = project.height / project.width;
            setNewHeight(Math.round(width * ratio));
        }
        setSelectedPreset(null);
    };

    // Handle Height change with aspect ratio lock
    const handleHeightChange = (value) => {
        const height = parseInt(value) || 0;
        setNewHeight(height);

        if (lockAspectRatio && project) {
            const ratio = project.width / project.height;
            setNewWidth(Math.round(height * ratio));
        }
        setSelectedPreset(null); // FIXED: was "setSelectedPresetI" (typo)
    };

    // Apply aspect ratio preset
    const applyAspectRatio = (aspectRatio) => {
        const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio); // FIXED: function name
        setNewHeight(dimensions.height);
        setNewWidth(dimensions.width);
        setSelectedPreset(aspectRatio.name);
    };

    // Calculate viewport scale to fit canvas in container
    const calculateViewportScale = () => {
        const container = canvasEditor.getElement().parentNode; // FIXED: removed ()
        if (!container) return 1;
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        const scaleX = containerWidth / newWidth;
        const scaleY = containerHeight / newHeight;
        return Math.min(scaleX, scaleY, 1);
    };

    // Apply canvas resize
    const handleApplySize = async () => {
        if (!canvasEditor || !project || (newWidth === project.width && newHeight === project.height)) {
            return;
        }

        setProcessingMessage("Resizing Canvas...");

        try {
            // Resize the canvas
            canvasEditor.setWidth(newWidth);
            canvasEditor.setHeight(newHeight);

            // Calculate and apply viewport scale
            const viewportScale = calculateViewportScale();

            canvasEditor.setDimensions(
                {
                    width: newWidth * viewportScale,
                    height: newHeight * viewportScale,
                },
                {
                    backstoreOnly: false
                }
            );

            canvasEditor.setZoom(viewportScale);
            canvasEditor.calcOffset();
            canvasEditor.requestRenderAll();

            // Update project in database
            await updateProject({ // FIXED: was "updatedProject"
                projectId: project._id,
                width: newWidth,
                height: newHeight,
                canvasState: canvasEditor.toJSON(),
            });
        } catch (error) {
            console.error("Error resizing canvas:", error);
            alert("Failed to resize canvas. Please try again.");
        } finally {
            setProcessingMessage(null);
        }
    };

    // FIXED: Logic error - was checking newHeight !== project.width
    const hasChanges = newWidth !== project.width || newHeight !== project.height;

    return (
        <div className="space-y-6">
            {/* Current Size display */}
            <div className="bg-slate-700/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-white mb-2">
                    Current Size
                </h4>
                <div className="text-xs text-white/70">
                    {project.width} × {project.height} Pixels
                </div>
            </div>

            {/* Manual Size input */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-white">Custom Size</h3>

                    <Button
                        variant={"ghost"}
                        size={"sm"}
                        onClick={() => setLockAspectRatio((prev) => !prev)}
                        className={"text-white/70 hover:text-white p-1"}
                    >
                        {lockAspectRatio ? (
                            <Lock className="h-4 w-4" />
                        ) : (
                            <Unlock className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className={"text-xs text-white/70 mb-1 block"}>Width</Label>
                        <Input
                            type='number'
                            value={newWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            min='100'
                            max='5000'
                            className={"bg-slate-700 border-white/20 text-white"}
                        />
                    </div>
                    <div>
                        <Label className={"text-xs text-white/70 mb-1 block"}>Height</Label>
                        <Input
                            type='number'
                            value={newHeight}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            min='100'
                            max='5000'
                            className={"bg-slate-700 border-white/20 text-white"}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">
                        {lockAspectRatio ? "Aspect Ratio Locked" : "Free Resize"}
                    </span>
                </div>
            </div>

            {/* Aspect Ratio presets */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Aspect Ratio</h3>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {ASPECT_RATIOS.map((aspectRatio) => {
                        const dimensions = calculateAspectRatioDimensions(aspectRatio.ratio); // FIXED
                        return (
                            <Button
                                key={aspectRatio.name}
                                variant={
                                    selectedPreset === aspectRatio.name ? "default" : "outline"
                                }
                                size={"sm"}
                                onClick={() => applyAspectRatio(aspectRatio)}
                                className={`
                                    justify-between h-auto py-2 ${
                                        selectedPreset === aspectRatio.name
                                            ? "bg-cyan-500 hover:bg-cyan-600"
                                            : "text-left"
                                    }`}
                            >
                                <div>
                                    <div className="font-medium">
                                        {aspectRatio.name}
                                    </div>
                                    <div className="text-xs opacity-70">
                                        {dimensions.width} × {dimensions.height} (
                                        {aspectRatio.label})
                                    </div>
                                </div>
                                <Monitor className="h-4 w-4" />
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* ADDED: Apply Button */}
            <Button
                onClick={handleApplySize}
                disabled={!hasChanges || isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            >
                <Expand className="h-4 w-4 mr-2" />
                {isLoading ? "Applying..." : "Apply Size"}
            </Button>
        </div>
    );
}

// 'use client';

// import React, {useState, useEffect} from "react";
// import {Button} from "@/components/ui/button"
// import { Input } from "@/components/ui/input";
// import { Expand, Lock,Unlock,Monitor } from "lucide-react";
// import { useCanvas } from "@/context/context";
// import { useConvexMutation } from "@/hooks/use-convex-query";
// import { api } from "../../../../../../../convex/_generated/api";
// import { Label } from "@/components/ui/label";


// // Common aspect Ratio
// const ASPECT_RATIOS = [
//     { name: "Instagram Story", ratio: [9, 16], label: "9:16" },
//     { name: "Instagram Post", ratio: [1, 1], label: "1:1" },
//     { name: "Youtube Thumbnail", ratio: [16, 9], label: "16:9" },
//     { name: "Portrait", ratio: [2, 3], label: "2:3" },
//     { name: "Facebook Cover", ratio: [851, 315], label: "2.7:1" },
//     { name: "Twitter Header", ratio: [3, 1], label: "3:1" },
// ];

// export function ResizeControls ({project}) {
//     const { canvasEditor, processingMessage, setProcessingMessage } = useCanvas();
//     const [newWidth, setNewWidth] = useState(project?.width || 800);
//     const [newHeight,setNewHeight] = useState(project?.height || 600);
//     const [lockAspectRatio, setLockAspectRatio] = useState(true);
//     const [selectedPreset,setSelectedPreset] = useState(null);

//     const {
//         mutate : updatedProject,
//         data,
//         isLoading
//     } = useConvexMutation(api.projects.updateProject);

//     useEffect(() => {
//         if(!isLoading && data) {
//             window.location.reload();
//         }
//     },[data , isLoading])
//     ;


//     // Calculate dimentsions for aspect ratio based on origina; canvas size
//     const calculateAspectRatioDimentions = (ratio) => {
//         if(!project) return {width : project.width, height : project.height};

//         const [ratioW, ratioH] = ratio;
//         const originalArea  = project.width * project.height;

//         // Calculate new Dimensions maintiaing the same area approximatley
//         const aspectRatio = ratioW / ratioH;
//         const newHeight = Math.sqrt(originalArea / aspectRatio);
//         const newWidth = newHeight * aspectRatio;

        
//         return {
//             width : Math.round(newWidth),
//             height : Math.round(newHeight),
//         }

//     }

//     // Handle width change with aspect  ratio lock
//     const handleWidthChange = (value) => {
//         const width  = parseInt(value) || 0;
//         setNewWidth(width);

//         if(lockAspectRatio && project) {
//             const ratio = project.height / project.width;
//             setNewHeight(Math.round(width * ratio));
//         }
//         setSelectedPreset(null);
//     };

//     // Handle Height change with aspect ratio lock
//     const handleHeightChange = (value) => {
//         const height = parseInt(value) || 0;
//         setNewHeight(height);

//         if(lockAspectRatio && project) {
//             const ratio = project.width / project.height;
//             setNewWidth(Math.round(height * ratio));
//         }
//         setSelectedPresetI(null)
//     }

//     // Apply aspect ratio preset
//     const applyAspectRatio = (aspectRatio) => {
//         const dimensions = calculateAspectRatioDimentions(aspectRatio.ratio);
//         setNewHeight(dimensions.height);
//         setNewWidth(dimensions.width);
//         setSelectedPreset(aspectRatio.name);
//     }

//     // Calculate viewport scale to fit canvas in container
//     const calculateViewportScale = () => {
//         const container = canvasEditor.getElement().parentNode();
//         if(!container) return 1;
//         const containerWidth = container.clientWidth - 40;
//         const containerHeight = container.clientHeight - 40;
//         const scaleX = containerWidth / newWidth;
//         const scaleY = containerHeight / newHeight;
//         return Math.min(scaleX, scaleY, 1);
//     }

//     // Apply canvas resize
//     const handleApplySize = async() => {
//         if(!canvasEditor || !project || (newWidth === project.width && newHeight === project.height))
//         {
//             return;
//         }

//         setProcessingMessage("Resizing Canvas...")

//         try{
//             // Reszie  the canvas
//             canvasEditor.setWidth(newWidth);
//             canvasEditor.setHeight(newHeight);

//             // Cacluate and apply viewport scale
//             const viewportScale = calculateViewportScale();

//             canvasEditor.setDimensions(
//                 {
//                     width  : newWidth * viewportScale,
//                     height : newHeight * viewportScale,
//                 },
//                  {
//                     backstoreOnly : false
//                  }
//             );

//             canvasEditor.setZoom(viewportScale);
//             canvasEditor.calcOffset();
//             canvasEditor.requestRenderAll();

//             // Update project in database
//             await updatedProject({
//                 projectId : project._id,
//                 width : newWidth,
//                 height : newHeight, 
//                 canvasState : canvasEditor.toJSON(),
//             });
//             }
       
//           catch(error)
//           {
//             console.error("Error resizing canvas:", error);
//             alert("Failed to resize canvas. Please try again.");
//           } finally {
//             setProcessingMessage(null);
//           }
        
//         }


//         if(!canvasEditor ||!project) {
//             return (
//                 <div className='p-4'>
//                     <p className="text-white/70 text-sm">
//                         Canvas Not Ready
//                     </p>

//                 </div>
//             )
//         }

//         const hasChanges = newHeight !== project.width || newHeight !== project.height;

//     return (
//         <div className="space-y-6">
//             {/* Current Size display */}
//             <div className="bg-slate-700/30 rounded-lg p-3">
//                 <h4 className="text-sm font-medium text-white mb-2">
//                     Current Size 
//                 </h4>
//                 <div className="text-xs text-white/70">
//                 {project.width} × {project.height} Pixels
//                 </div>
//             </div>

//             {/* Manuaal Size input */}
//             <div className="space-y-4">
//                 <div className="flex items-center justify-between mb-2">
//                     <h3 className="text-sm font-medium text-white">Custom Size</h3>

//                     <Button
//                     variant={"ghost"}
//                     size={"sm"}
//                     onClick={() => setLockAspectRatio((prev) => !prev)}
//                     className={"text-white/70 hover:text-white p-1"}
//                     >
//                         {
//                             lockAspectRatio ? (
//                                 <Lock className="h-4 w-4" />
//                             ) : 
//                             (
//                                 <Unlock className="h-4 w-4" />
//                             )
//                         }
//                     </Button>
//                 </div>

//                     <div className="grid grid-cols-2 gap-3">
//                         <div>
//                             <Label className={"text-xs text-white/70 mb-1 block"}>Width</Label>
//                             <Input
//                             type='number'
//                             value={newWidth}
//                             onChange ={(e)=> handleWidthChange(e.target.value)}
//                             min='100'
//                             max='5000'
//                             className={"bg-slate-700 border-white/20 text-white"}
//                             />

//                         </div>
//                         <div>
//                             <Label className={"text-xs text-white/70 mb-1 block"}>Height</Label>
//                             <Input
//                             type='number'
//                             value={newHeight}
//                             onChange ={(e)=> handleHeightChange(e.target.value)}
//                             min='100'
//                             max='5000'
//                             className={"bg-slate-700 border-white/20 text-white"}
//                             />
//                         </div>
//                     </div>

//                     <div className="flex items-center justify-between text-xs">
//                         <span className="text-white/70">
//                         {
//                             lockAspectRatio ? "Aspect Ratio Locked"  : "Free Resize"
//                         }
//                         </span>
//                     </div>
//             </div>

//             {/* Aspect Ratio presets */}
//             <div className="space-y-3">
//                 <h3 className="text-sm font-medium text-white">Aspect Ratio</h3>
//                 <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
//                         {
//                             ASPECT_RATIOS.map((aspectRatio) => {
//                                 const dimensions = calculateAspectRatioDimentions(aspectRatio.ratio)
//                                 return (
//                                     <Button
//                                     key={aspectRatio.name}
//                                     variant={
//                                         selectedPreset === aspectRatio.name ? "default" : "outline"
//                                     }
//                                     size={"sm"}
//                                     onClick={() => applyAspectRatio(aspectRatio)}
//                                     className={`
//                                         justify-between h-auto py-2 ${selectedPreset === aspectRatio.name ? "bg-cyan-500 hover:bg-cyan-600" : "text-left"}`}
//                                     >
//                                        <div>
//                   <div className="font-medium">{aspectRatio.name}</div>
//                   <div className="text-xs opacity-70">
//                     {dimensions.width} × {dimensions.height} (
//                     {aspectRatio.label})
//                   </div>
//                 </div> 
//                                         <Monitor className="h-4 w-4" />
//                                     </Button>
//                                 )
//                             })
//                         }
//                 </div>

//             </div>
//         </div>
//     )
// }