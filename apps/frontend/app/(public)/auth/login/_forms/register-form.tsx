import { Card } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(31, "Username must be at most 31 characters long"),
    email: z.email("Invalid email address"),
    image: z.string().optional(),
    password: z.string().min(4, "Password must be at least 4 characters long"),
    confirmPassword: z
      .string()
      .min(4, "Confirm Password must be at least 4 characters long"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password and confirmation do not match.",
    path: ["confirmPassword"],
  });

export const RegisterForm = () => {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });

  return (
    <Card.Root className="mx-auto w-full">
      <Card.Header>
          <Card.Title className="text-2xl">Register</Card.Title>
          <Card.Description>
            Enter your details below to create a new account
          </Card.Description>
      </Card.Header>
      <Card.Content>
          <form method="POST" onSubmit={form.handleSubmit((data) => console.log(data))}
          // use:registerEnhance
          action="?/register">
              <Form.Field form={registerForm} name="username">
                  <Form.Control>
                      {#snippet children({ props })}
                          <Form.Label>Username</Form.Label>
                          <Input
                              {...props}
                              bind:value={$registerFormData.username} />
                      {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={registerForm} name="email">
                  <Form.Control>
                      {#snippet children({ props })}
                          <Form.Label>Email</Form.Label>
                          <Input
                              {...props}
                              type="email"
                              bind:value={$registerFormData.email} />
                      {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={registerForm} name="image">
                  <Form.Control>
                      {#snippet children({ props })}
                          <Form.Label>Image</Form.Label>
                          <Input
                              {...props}
                              type="text"
                              bind:value={$registerFormData.image} />
                      {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={registerForm} name="password">
                  <Form.Control>
                      {#snippet children({ props })}
                          <Form.Label>Password</Form.Label>
                          <Input
                              {...props}
                              type="password"
                              bind:value={$registerFormData.password} />
                      {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
              </Form.Field>

              <Form.Field form={registerForm} name="confirmPassword">
                  <Form.Control>
                      {#snippet children({ props })}
                          <Form.Label>Confirm Password</Form.Label>
                          <Input
                              {...props}
                              type="password"
                              bind:value={
                                  $registerFormData.confirmPassword
                              } />
                      {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
              </Form.Field>
              <Form.Button className="mt-4">Submit</Form.Button>
          </form>
      </Card.Content>
  </Card.Root>
  )
};
