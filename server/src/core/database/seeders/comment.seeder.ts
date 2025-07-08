import { DataSource } from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Comment } from '../../../modules/comment/entities/comment.entity';
import { Discussion } from '../../../modules/discussion/entities/discussion.entity';
import { User } from '../../../modules/user/entities/user.entity';

export async function seedComments(dataSource: DataSource): Promise<void> {
  console.log('💬 Seeding comments...');

  const commentRepository = dataSource.getRepository(Comment);
  const userRepository = dataSource.getRepository(User);
  const discussionRepository = dataSource.getRepository(Discussion);

  // Check if comments already exist
  const commentCount = await commentRepository.count();
  if (commentCount > 0) {
    console.log(`💬 ${commentCount} comments already exist, skipping seeding`);
    return;
  }

  // Get all users who can comment
  const users = await userRepository.find({
    where: { role: UserRole.STUDENT},
    select: ['id'],
  });

  if (users.length === 0) {
    console.error('❌ No users found for creating comments');
    return;
  }

  // Get all discussions with their creation dates
  const discussions = await discussionRepository.find();
  if (discussions.length === 0) {
    console.error('❌ No discussions found to comment on');
    return;
  }

  // Generate random date between discussion creation and now
  const getRandomDateAfter = (startDate: Date): Date => {
    const now = new Date();
    return new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
  };

  // Sample comment content templates
  const commentTemplates = [
    'Saya setuju dengan pendapat ini. Terima kasih atas informasinya.',
    'Menurut saya ini sangat membantu untuk pemahaman materi kuliah.',
    'Boleh dijelaskan lebih detail mengenai poin kedua?',
    'Saya punya pengalaman serupa dan hasilnya memang seperti itu.',
    'Apakah ada referensi atau sumber yang bisa dibagikan?',
    'Saya kurang setuju dengan pendapat ini karena berdasarkan pengalaman saya...',
    'Terima kasih atas diskusinya yang sangat informatif.',
    'Bagaimana kalau kita coba pendekatan yang berbeda?',
    'Ini sangat relevan dengan materi yang sedang kita pelajari sekarang.',
    'Saya mengalami kesulitan yang sama. Ada yang punya solusi?',
    'Bisa tolong dijelaskan lebih sederhana? Saya masih bingung.',
    'Wah, ini perspektif baru yang belum pernah saya pikirkan sebelumnya!',
    'Saya sudah mencoba metode ini dan hasilnya sangat memuaskan.',
    'Ini sangat membantu untuk tugas yang sedang saya kerjakan.',
    'Kira-kira apa implikasi dari teori ini untuk praktek di lapangan?',
  ];

  // Reply templates
  const replyTemplates = [
    'Saya setuju dengan komentar Anda.',
    'Terima kasih atas tanggapannya!',
    'Boleh saya tambahkan bahwa...',
    'Betul sekali, saya juga berpikir demikian.',
    'Saya punya pengalaman berbeda mengenai hal ini...',
    'Mungkin bisa dilihat dari sudut pandang lain?',
    'Ini sangat membantu, terima kasih!',
    'Saya masih belum mengerti bagian ini, bisa dijelaskan lebih detail?',
    'Saya menemukan sumber yang mendukung pendapat ini di...',
    'Apakah ada contoh konkret yang bisa diberikan?',
    'Saya akan mencoba saran ini, terima kasih!',
    'Perspektif yang menarik, saya belum memikirkan hal itu.',
    'Ini menambah pemahaman saya tentang topik ini.',
    'Benar, tapi jangan lupa juga bahwa...',
    'Saya setuju, dan ingin menambahkan...',
  ];

  // Create comments
  const comments: Partial<Comment>[] = [];
  const discussionCommentCounts: Record<number, number> = {};

  // First create root comments
  for (const discussion of discussions) {
    // Random number of comments per discussion (0-5)
    const commentCount = Math.floor(Math.random() * 6);
    discussionCommentCounts[discussion.id] = commentCount;

    for (let i = 0; i < commentCount; i++) {
      // Select random user as commenter (but not the author of the discussion)
      let commenter;
      do {
        commenter = users[Math.floor(Math.random() * users.length)];
      } while (commenter.id === discussion.authorId);

      // Select random comment template
      const commentContent = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

      // Create comment with date AFTER the discussion's creation date
      const commentDate = getRandomDateAfter(discussion.createdAt);

      comments.push({
        content: commentContent,
        authorId: commenter.id,
        discussionId: discussion.id,
        isEdited: Math.random() < 0.1, // 10% chance of being edited
        parentId: null, // Root comment
        upvoteCount: Math.floor(Math.random() * 5), // 0-4 upvotes
        downvoteCount: Math.floor(Math.random() * 2), // 0-1 downvotes
        replyCount: 0, // Will be updated later
        createdAt: commentDate,
        updatedAt: commentDate,
      });
    }
  }

  // Save root comments
  const savedRootComments = await commentRepository.save(comments);
  console.log(`💬 Created ${savedRootComments.length} root comments`);

  // Now create reply comments
  const replyComments: Partial<Comment>[] = [];
  const replyCountMap: Record<number, number> = {};

  for (const rootComment of savedRootComments) {
    // 40% chance of having replies on a comment
    if (Math.random() < 0.4) {
      // Random number of replies (1-3)
      const replyCount = 1 + Math.floor(Math.random() * 3);
      replyCountMap[rootComment.id!] = replyCount;

      for (let i = 0; i < replyCount; i++) {
        // Select random user as replier (but not the author of the parent comment)
        let replier;
        do {
          replier = users[Math.floor(Math.random() * users.length)];
        } while (replier.id === rootComment.authorId);

        // Select random reply template
        const replyContent = replyTemplates[Math.floor(Math.random() * replyTemplates.length)];

        // Create reply with date AFTER the comment's creation date
        // Add between 5 minutes and 3 days after the parent comment
        const minTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const maxTime = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
        const timeToAdd = minTime + Math.random() * (maxTime - minTime);

        const replyDate = new Date(rootComment.createdAt!.getTime() + timeToAdd);

        replyComments.push({
          content: replyContent,
          authorId: replier.id,
          discussionId: rootComment.discussionId,
          isEdited: Math.random() < 0.05, // 5% chance of being edited
          parentId: rootComment.id,
          upvoteCount: Math.floor(Math.random() * 3), // 0-2 upvotes
          downvoteCount: Math.floor(Math.random() * 2), // 0-1 downvotes
          replyCount: 0, // Replies to replies not implemented
          createdAt: replyDate,
          updatedAt: replyDate,
        });
      }
    }
  }

  // Save reply comments
  const savedReplyComments = await commentRepository.save(replyComments);
  console.log(`💬 Created ${savedReplyComments.length} reply comments`);

  // Update reply counts for root comments
  for (const commentId in replyCountMap) {
    await commentRepository.update(parseInt(commentId), {
      replyCount: replyCountMap[commentId],
    });
  }

  // Update comment counts for discussions
  for (const discussionId in discussionCommentCounts) {
    // Count all comments (root + replies) for this discussion
    const totalComments =
      savedRootComments.filter((c) => c.discussionId === parseInt(discussionId)).length +
      savedReplyComments.filter((c) => c.discussionId === parseInt(discussionId)).length;

    await discussionRepository.update(parseInt(discussionId), {
      commentCount: totalComments,
    });
  }

  console.log('💬 Updated comment counts and reply counts');
}
