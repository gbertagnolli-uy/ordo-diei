# Enrollment Feature

This feature provides enrollment functionality for courses, allowing users to check their enrollment status and enroll in courses.

## Hooks

### `useCheckEnrollment(courseId: string)`

Checks if the current user is enrolled in a specific course.

**Returns:**
- `isEnrolled: boolean` - Whether the user is enrolled in the course
- `enrollmentData: EnrolledCourse[] | undefined` - Full enrollment data
- `isLoading: boolean` - Loading state
- `error: Error | null` - Any error that occurred

**Example:**
```tsx
const { isEnrolled, isLoading } = useCheckEnrollment(courseId);

if (isLoading) return <div>Checking enrollment...</div>;
if (isEnrolled) return <div>You're enrolled!</div>;
```

### `useEnrollCourse(context?: EnrollCourseContext)`

Enrolls the current user in a course.

**Parameters:**
- `context?: EnrollCourseContext` - Optional context with callbacks
  - `onSuccess?: () => void` - Called when enrollment succeeds
  - `onError?: (error: Error) => void` - Called when enrollment fails

**Returns:**
- `enroll: (courseId: string) => void` - Function to enroll in a course
- `isPending: boolean` - Loading state for enrollment
- `isError: boolean` - Whether an error occurred
- `error: Error | null` - The error that occurred

**Example:**
```tsx
const { enroll, isPending } = useEnrollCourse({
  onSuccess: () => toast.success("Successfully enrolled!"),
  onError: (error) => toast.error(error.message),
});

const handleEnroll = () => {
  enroll(courseId);
};
```

## Components

### `EnrollButton`

A ready-to-use button component that handles enrollment state and actions.

**Props:**
- `courseId: string` - The ID of the course
- `onEnrollSuccess?: () => void` - Optional success callback
- `onEnrollError?: (error: Error) => void` - Optional error callback

**Example:**
```tsx
<EnrollButton
  courseId="course-123"
  onEnrollSuccess={() => console.log("Enrolled!")}
/>
```

## Usage in Course Detail Page

The enrollment functionality has been integrated into the course detail page (`/courses/$id.tsx`). The enroll button appears below the course information and automatically:

1. Checks if the user is already enrolled
2. Shows "Enrolled" state if they are
3. Shows "Enroll Now" button if they're not
4. Handles the enrollment process with loading states
5. Shows appropriate toast notifications

## API Integration

The hooks use the existing `courses` API router which includes:

- `getCourseEnrollments(courseId)` - Gets all enrollments for a course
- `enrollUser(userId, courseId)` - Enrolls a user in a course

The hooks automatically handle authentication by using the current user from the `useAccount` hook.

## Error Handling

The enrollment hooks include comprehensive error handling:

- **400**: Invalid course ID or already enrolled
- **401**: User not authenticated
- **404**: Course not found
- **409**: Already enrolled in course
- **Other**: Generic error message

All errors are displayed as toast notifications to provide immediate feedback to users.
