## DB migration
```
supabase login

supabase link --project-ref ********************

#Docker desktop must be started
supabase db dump -f schema.sql
supabase db dump --data-only --use-copy -f data.sql

```
migrating data is not easy. not sure if you can migrate the authentication data also

## other things to update
- the trial expirying date of stripe
- the webhook url in stripe
- the auth callback url need to update