using System.Collections.Generic;
using System.Linq;

namespace backend.Helpers
{
    /// <summary>
    /// Configuration for subjects that are shared across multiple streams.
    /// Physics and Chemistry are taught in both Physical and Biological streams,
    /// so questions for these subjects should be visible to students from either stream.
    /// </summary>
    public static class SharedSubjects
    {
        /// <summary>
        /// List of subject names that are shared between Physical and Biological streams.
        /// Questions for these subjects will be shown regardless of the selected stream.
        /// </summary>
        public static readonly HashSet<string> SubjectsSharedAcrossStreams = new HashSet<string>(System.StringComparer.OrdinalIgnoreCase)
        {
            "Physics",
            "Chemistry"
        };

        /// <summary>
        /// List of streams that share the above subjects.
        /// </summary>
        public static readonly HashSet<string> StreamsWithSharedSubjects = new HashSet<string>(System.StringComparer.OrdinalIgnoreCase)
        {
            "physical",
            "biological"
        };

        /// <summary>
        /// Checks if a subject is shared across multiple streams.
        /// </summary>
        /// <param name="subjectName">The name of the subject to check</param>
        /// <returns>True if the subject is shared, false otherwise</returns>
        public static bool IsSharedSubject(string subjectName)
        {
            if (string.IsNullOrWhiteSpace(subjectName))
                return false;

            return SubjectsSharedAcrossStreams.Contains(subjectName);
        }

        /// <summary>
        /// Checks if a stream is part of the shared subjects group.
        /// </summary>
        /// <param name="streamName">The name of the stream to check</param>
        /// <returns>True if the stream has shared subjects, false otherwise</returns>
        public static bool IsStreamWithSharedSubjects(string streamName)
        {
            if (string.IsNullOrWhiteSpace(streamName))
                return false;

            return StreamsWithSharedSubjects.Contains(streamName);
        }
    }
}
