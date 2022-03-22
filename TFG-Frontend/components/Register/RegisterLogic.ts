import registerRequest from "./RegisterRequest";
import registerValidation from "./RegisterValidation";

export default function handleRegister(event: any) {
    event.preventDefault();

    if(!registerValidation(this)) {
        return;
    }

    registerRequest(this).then(
        (response) => {
            if (response.status == 200) {
                let lista: Map<string, string> = new Map<string, string>().set(
                    "registerOk",
                    response.data.message[0]
                );
                this.setState({
                    formError: '',
                    requestOK: lista,
                    requestErrors: new Map<string, string>(),
                });
            }
        },
        (error) => {
            let lista: Map<string, string> = new Map<string, string>().set(
                "registerError",
                error.response.data.message[0]
            );
            this.setState({
                formError: error.response.data.formError,
                requestErrors: lista,
                requestOK: new Map<string, string>(),
            });
        }
    );
}
