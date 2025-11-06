import {useQuery , useMutation} from "convex/react"
import { useState  , useEffect} from "react"
import { toast } from "sonner"

export const useConvexQuery = (query,...args) => {
    const result = useQuery(query,...args);
    const [data,setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error,setError] = useState(null);


    // use Effect to handle the state changes based on the query result
    useEffect(() => {
        if(result === undefined) {
            setIsLoading(true)
        }
        else{
            try {
                setData(result)
                setError(null)
            } catch (error) {
                setError(error)
                toast.error(error.message)
            }
            finally {
                setIsLoading(false)
            }
        }
    },[result])

    return {
        data,
        isLoading,
        error
    }
}

export const useConvexMutation = (mutation) => {
    const mutationFn = useMutation(mutation);
    const [data,setData] = useState(undefined);
    const [isLoading,setIsLoading] = useState(false);
    const [error,setError] = useState(null);

    const mutate = async (...args) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await mutationFn(...args)
            setData(response)
            return response ;
        } catch (error) {
            setError(error);
            toast.error(error.message);
            throw error;
        }
        finally {
            setIsLoading(false)
        }
    }

    return  {mutate, data, isLoading, error}

}