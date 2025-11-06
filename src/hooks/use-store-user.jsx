import  {useUser} from "@clerk/nextjs"
import {useConvexAuth, useMutation} from "convex/react";
import {useEffect, useState} from "react"
import {api} from "../../convex/_generated/api";

export function useStoreUser () {
    const {isLoading,isAuthenticated} = useConvexAuth();
    const {user} = useUser()

    // When this state is et we know the server
    // has stored the user
    const [userId, setUserId] = useState(null)
    const storeUser = useMutation(api.user.store)

    //Call the 'storeUser' mutation function to store
    // the current user tin the "users' table and return the 'id' value

    useEffect(() => {
        // if the user is not logged dont do anything
        if(!isAuthenticated) {
            return;
        }

        // store the user in the database
        // Recall that 'storeuser' get he user infomation via the 'auth'
        // object on the server you don't need to pass anything manullay here.

        async  function createUser() {
            const id = await storeUser()
            setUserId(id)
        }
        createUser()
        return () => setUserId(null)

        /// Make sure the effect resum if the user logs in with a diffrent identity
    },[isAuthenticated, storeUser, user?.id])

    return {
        isLoading : isLoading || (isAuthenticated && userId == null),
        isAuthenticated : isAuthenticated && userId !== null
    }
}