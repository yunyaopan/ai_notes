## styling
refer to: https://ui.shadcn.com/blocks/login

## responsiveness in the login form
useFormStatus hook
1. User submits → form calls loginAction (server action).
2. React automatically sets pending = true while the action runs.
3. FormInputs and SubmitButton read pending from useFormStatus().
4. Components react: spinner shows, button/inputs disable.
5. Server action completes → React sets pending = false.
6. UI updates (or redirect happens).